import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { RouterRouter } from "../router";

const router = createTRPCProxyClient<RouterRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

async function main() {
  const batchSize = 2;

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

main();
