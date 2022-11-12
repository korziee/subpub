import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../router";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:2022",
    }),
  ],
});

async function main() {
  const result = await client.zod.mutate({ name: "jye" });

  // Type safe
  console.log(result);
}

function sayHello() {
  console.log("Hello");
}
