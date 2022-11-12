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
      await setTimeout(100);
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

let processedMessagesLastSecond = 0;
let processedMessages = 0;

setInterval(() => {
  processedMessagesLastSecond = processedMessages;
  processedMessages = 0;
  console.log(processedMessagesLastSecond, "messages/second");
}, 1000);

async function main() {
  subscribe("numbers-subscription-1", 100, async ({ message }) => {
    // simulate slow consumers
    // await setTimeout(Math.random() * 100);
    processedMessages++;

    const number = message.data;
    console.log(
      "Processing number: ",
      number,
      processedMessages,
      processedMessagesLastSecond
    );
  }).catch(console.error);
}

async function fastMain() {
  while (true) {
    const messages = await router.getMessages.query({
      subscriptionName: "numbers-subscription-1",
      batchSize: 500,
    });

    if (messages.length === 0) {
      await setTimeout(100);
      continue;
    }

    await messages.map((message) =>
      router.ack.mutate({ receiptId: message.receiptId })
    );
    processedMessages += messages.length;
  }
}

// main();
fastMain();
