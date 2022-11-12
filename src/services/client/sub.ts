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

let nodes = [
  createTRPCProxyClient<SubscriptionNodeRouter>({
    links: [
      httpBatchLink({
        url: "http://sub-node-1:2022",
      }),
    ],
  }),
  createTRPCProxyClient<SubscriptionNodeRouter>({
    links: [
      httpBatchLink({
        url: "http://sub-node-2:2022",
      }),
    ],
  }),
];

async function main() {
  const a = await router.zod.mutate({ name: "aaa" });
  const b = await nodes[0].subNodeThing.mutate({ id: "hello" });

  // Type safe
  console.log(a, b);
}

main();
