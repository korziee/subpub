import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../router";
import type { SubNodeRouter } from "../sub-node";

const router = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

let nodes = [
  createTRPCProxyClient<SubNodeRouter>({
    links: [
      httpBatchLink({
        url: "http://sub-node-1:2022",
      }),
    ],
  }),
  createTRPCProxyClient<SubNodeRouter>({
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
