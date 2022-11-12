import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { RouterRouter } from "../router";
import type { SubscriptionNodeRouter } from "../subscription-node";

const router = createTRPCProxyClient<RouterRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

async function main() {
  const messages = await router.getMessages.query({
    subscriptionName: "numbers-subscription",
    batchSize: 10,
  });

  // Type safe
  console.log(`Got ${messages.length} messages:`, messages);
}

main();
