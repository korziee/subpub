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
  const messageId = await router.publishToTopic.mutate({
    topicName: "numbers-topic",
    messageData: "1",
  });

  // Type safe
  console.log(`Published message:`, messageId);
}

main();
