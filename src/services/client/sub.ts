import { setTimeout } from "node:timers/promises";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { RouterRouter } from "../router";
import { Message } from "../../Message";

const router = createTRPCProxyClient<RouterRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

async function subscribe(
  subscriptionName: string,
  batchSize: number,
  handler: ({ message }: { message: Message }) => Promise<void>
) {
  while (true) {
    const messages = await router.getMessages.query({
      subscriptionName,
      batchSize,
    });

    if (messages.length === 0) {
      await setTimeout(1000);
      continue;
    }

    await Promise.all(
      messages.map((message) =>
        handler({ message })
          .then(() => {
            // assume successfully processed, ack message
            return router.ack.mutate({ receiptId: message.receiptId });
          })
          .catch((e) => {
            console.error("Message handler threw", e);
          })
      )
    );
  }
}

async function main() {
  subscribe("numbers-subscription-1", 10, async (msg) => {
    const number = msg.message;
    console.log("Processing number: ", number);
  }).catch(console.error);
}

main();
