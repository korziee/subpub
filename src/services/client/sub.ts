import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../router";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://router-1:2022",
    }),
  ],
});

async function main() {
  const result = await client.zod.mutate({ name: "aaa" });

  // Type safe
  console.log(result);
}

main();
