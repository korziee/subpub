import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { RouterRouter } from "../router";
import { setTimeout } from "node:timers/promises";

const router = createTRPCProxyClient<RouterRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

async function main() {
  const numBatches = 1000;
  const batchSize = 10;

  for (let batch = 0; batch < numBatches; batch++) {
    const messages = [];
    const batchId = Math.random().toString(32).split(".")[1];

    for (let i = 0; i < batchSize; i += 1) {
      messages.push(`number-${batchId}-${i}`);
    }
    await router.publishToTopic.mutate({
      topicName: "numbers-topic",
      messageData: messages,
    });

    console.log(`Published ${batchSize} messages on batch: ${batchId}`);
  }
}

async function trickle() {
  const batchSize = 5;

  while (true) {
    const messages = [];
    const batchId = Math.random().toString(32).split(".")[1];

    for (let i = 0; i < batchSize; i += 1) {
      messages.push(`number-${batchId}-${i}`);
    }
    await router.publishToTopic.mutate({
      topicName: "numbers-topic",
      messageData: messages,
    });

    console.log(`Published ${batchSize} messages on batch: ${batchId}`);
    await setTimeout(Math.random() * 50);
  }
}

// main();
trickle();
