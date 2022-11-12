import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { getPartitionDb, loadPartitionDbs } from "./partitions";

// construct DBs for all partitions we are responsible for
loadPartitionDbs();

export type SubscriptionNodeRouter = typeof subscriptionNodeRouter;

const t = initTRPC.create();

const subscriptionNodeRouter = t.router({
  enqueueSubscriptionMessages: t.procedure
    .input(
      z.array(
        z.object({
          subscriptionId: z.string(),
          partitionId: z.string(),
          messageId: z.string(),
          messageData: z.string(),
        })
      )
    )
    .mutation((req) => {
      for (const messageData of req.input) {
        getPartitionDb(
          messageData.subscriptionId,
          messageData.partitionId
        ).enqueueMessage(messageData.messageId, messageData.messageData);
      }
    }),

  getMessages: t.procedure
    .input(
      z.object({
        subscriptionId: z.string(),
        partitionKey: z.string(),
        batchSize: z.number(),
      })
    )
    .query(async (req) => {
      return getPartitionDb(
        req.input.subscriptionId,
        req.input.partitionKey
      ).getMessages(req.input.batchSize);
    }),

  ack: t.procedure
    .input(
      z.object({
        subscriptionId: z.string(),
        partitionKey: z.string(),
        messageId: z.string(),
      })
    )
    .mutation(async (req) => {
      return getPartitionDb(
        req.input.subscriptionId,
        req.input.partitionKey
      ).ackMessage(req.input.messageId);
    }),

  modifyAckDeadline: t.procedure
    .input(
      z.object({
        subscriptionId: z.string(),
        partitionKey: z.string(),
        messageId: z.string(),
        deadlineMilliseconds: z.number(),
      })
    )
    .mutation(async (req) => {
      return getPartitionDb(
        req.input.subscriptionId,
        req.input.partitionKey
      ).modifyMessageAckDeadline(
        req.input.messageId,
        req.input.deadlineMilliseconds
      );
    }),

  getPartitionStatistics: t.procedure
    .input(
      z.object({
        subscriptionId: z.string(),
        partitionKey: z.string(),
      })
    )
    .query(async (req) => {
      const db = getPartitionDb(
        req.input.subscriptionId,
        req.input.partitionKey
      );

      return {
        pendingMessagesCount: db.pendingMessagesCount,
        inflightMessagesCount: db.inflightMessagesCount,
        oldestMessageTimestamp: db.oldestMessageTimestamp,
      };
    }),
});

createHTTPServer({
  router: subscriptionNodeRouter,
  createContext() {
    return {};
  },
}).listen(2022);
