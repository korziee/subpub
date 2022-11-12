import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

export type SubscriptionNodeRouter = typeof subscriptionNodeRouter;

const t = initTRPC.create();

const subscriptionNodeRouter = t.router({
  enqueueSubscriptionMessages: t.procedure
    .input(
      z.array(
        z.object({
          subscriptionId: z.string(),
          partitionKey: z.string(),
          messageId: z.string(),
          messageData: z.string(),
        })
      )
    )
    .mutation(async (req) => {
      console.log("enqueueSubscriptionMessage::req", req.input);
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
      console.log("getMessages::req", req);
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
      console.log("ack::req", req);
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
      console.log("ack::modifyAckDeadline", req);
    }),

  getPartitionStatistics: t.procedure
    .input(
      z.object({
        subscriptionId: z.string(),
        partitionKey: z.string(),
      })
    )
    .query(async (req) => {
      console.log("ack::getPartitionStatistics", req);

      return {
        pendingMessageCount: 0,
        inflightMessageCount: 0,
        oldestMessageDate: new Date(),
      };
    }),
});

createHTTPServer({
  router: subscriptionNodeRouter,
  createContext() {
    return {};
  },
}).listen(2022);
