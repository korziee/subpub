import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

import type { SubscriptionNodeRouter } from "../subscription-node";
import { Config, config } from "../config";

const nodeIds = new Set<string>();

const subscriptions = new Map<
  string,
  Config["topics"][number]["subscriptions"][number] & { topicName: string }
>();

config.topics.forEach((topic) => {
  topic.subscriptions.forEach((sub) => {
    subscriptions.set(sub.name, {
      ...sub,
      topicName: topic.name,
    });

    sub.partitions.forEach((part) => {
      nodeIds.add(part.node);
    });
  });
});

const nodes = new Map<
  string,
  ReturnType<typeof createTRPCProxyClient<SubscriptionNodeRouter>>
>();

[...nodeIds.values()].map((node) => {
  nodes.set(
    node,
    createTRPCProxyClient<SubscriptionNodeRouter>({
      links: [
        httpBatchLink({
          url: `http://sub-${node}:2022`,
        }),
      ],
    })
  );
});

export type RouterRouter = typeof router;
const t = initTRPC.create();

const router = t.router({
  publishToTopic: t.procedure
    .input(
      z.object({ topicName: z.string(), messageData: z.array(z.string()) })
    )
    .mutation(async (req) => {
      const topic = config.topics.find((t) => t.name === req.input.topicName);

      if (typeof topic === "undefined") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find topic with name: ${req.input.topicName}`,
        });
      }

      let msgIds: string[] = [];

      const nodeMsgs = new Map<
        string,
        Array<{
          subscriptionId: string;
          partitionId: string;
          messageId: string;
          messageData: string;
        }>
      >([...nodeIds.values()].map((id) => [id, []]));

      topic.subscriptions.forEach((sub) => {
        req.input.messageData.forEach((msg) => {
          const partitionIndex = Math.floor(
            Math.random() * sub.partitions.length
          );
          const partition = sub.partitions[partitionIndex];
          const msgs = nodeMsgs.get(partition.node)!;
          const msgId = Math.random().toString(32).split(".")[1];
          msgIds.push(msgId);

          msgs.push({
            subscriptionId: sub.name,
            partitionId: partition.id,
            messageId: msgId,
            messageData: msg,
          });
        });
      });

      await Promise.all(
        [...nodeMsgs.entries()].map(async ([node, msgs]) => {
          return nodes.get(node)?.enqueueSubscriptionMessages.mutate(msgs);
        })
      );

      return msgIds;
    }),

  getMessages: t.procedure
    .input(z.object({ subscriptionName: z.string(), batchSize: z.number() }))
    .query(async (req) => {
      const subscription = subscriptions.get(req.input.subscriptionName);

      if (!subscription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find subscription with name: ${req.input.subscriptionName}`,
        });
      }

      const partitionIndex = Math.floor(
        Math.random() * subscription.partitions.length
      );

      const partition = subscription.partitions[partitionIndex];

      const msgs = await nodes.get(partition.node)!.getMessages.query({
        batchSize: req.input.batchSize,
        partitionKey: partition.id,
        subscriptionId: req.input.subscriptionName,
      });

      return msgs;
    }),

  ack: t.procedure
    .input(z.object({ receiptId: z.string() }))
    .mutation(async (req) => {
      const [subscriptionId, partitionId, messageId] =
        req.input.receiptId.split("-");

      const subscription = subscriptions.get(subscriptionId);

      if (!subscription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find subscription with name: ${subscriptionId} for receiptId: "${req.input.receiptId}"`,
        });
      }

      const partition = subscription.partitions.find(
        (p) => p.id === partitionId
      );

      if (!partition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find partition with id: ${partitionId} for receiptId: "${req.input.receiptId}"`,
        });
      }

      await nodes.get(partition.node)?.ack.mutate({
        messageId,
        subscriptionId,
        partitionKey: partition.id,
      });
    }),

  modifyAckDeadline: t.procedure
    .input(
      z.object({ receiptId: z.string(), deadlineMilliseconds: z.number() })
    )
    .mutation(async (req) => {
      const [subscriptionId, partitionId, messageId] =
        req.input.receiptId.split("-");

      const subscription = subscriptions.get(subscriptionId);

      if (!subscription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find subscription with name: ${subscriptionId} for receiptId: "${req.input.receiptId}"`,
        });
      }

      const partition = subscription.partitions.find(
        (p) => p.id === partitionId
      );

      if (!partition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find partition with id: ${partitionId} for receiptId: "${req.input.receiptId}"`,
        });
      }

      await nodes.get(partition.node)?.modifyAckDeadline.mutate({
        messageId,
        subscriptionId,
        partitionKey: partition.id,
        deadlineMilliseconds: req.input.deadlineMilliseconds,
      });
    }),
});

createHTTPServer({
  router,
  createContext() {
    return {};
  },
  onError: (err) => {
    console.error("Error on Router", err);
  },
}).listen(2022);
