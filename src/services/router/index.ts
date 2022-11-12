import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

export type RouterRouter = typeof router;

const t = initTRPC.create();

const router = t.router({
  publishToTopic: t.procedure
    .input(z.object({ topicName: z.string(), messageData: z.string() }))
    .mutation(async (req) => {
      console.log("publishToTopic::req", req);
      return "message-id";
    }),
  getMessages: t.procedure
    .input(z.object({ subscriptionName: z.string(), batchSize: z.number() }))
    .query(async (req) => {
      console.log("getMessages::req", req);
      return [
        {
          data: "data",
          receiptId: "receiptId",
          deliveryAttempts: 0,
        },
      ];
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
}).listen(2022);
