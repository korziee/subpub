import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

import type { SubscriptionNodeRouter } from "../subscription-node";
import { Config, config } from "../config";

const nodeIds = new Set<string>();

config.topics.forEach((topic) => {
  topic.subscriptions.forEach((sub) => {
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
          partitionKey: string;
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
            partitionKey: partition.key,
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
      let sub: Config["topics"][number]["subscriptions"][number];

      config.topics.forEach((a) => {
        a.subscriptions.forEach((s) => {
          // TODO
          if (s.name === req.input.subscriptionName) {
            sub = s;
          }
        });
      });

      // @ts-ignore
      if (!sub) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not find subscription with name: ${req.input.subscriptionName}`,
        });
      }

      const partitionIndex = Math.floor(Math.random() * sub.partitions.length);

      const partition = sub.partitions[partitionIndex];

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
      console.log("ack::req", req);
    }),

  modifyAckDeadline: t.procedure
    .input(
      z.object({ receiptId: z.string(), deadlineMilliseconds: z.number() })
    )
    .mutation(async (req) => {
      console.log("modifyAckDeadline::req", req);
    }),
});

createHTTPServer({
  router,
  createContext() {
    return {};
  },
  onError: (err) => {
    console.error("THER WAS AN ERROR", err);
  },
}).listen(2022);
