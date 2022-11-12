import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import type { RouterRouter } from "../services/router";

export const trpc = createTRPCNext<RouterRouter>({
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: "http://router-1:2022",
        }),
      ],
    };
  },
  ssr: false,
});
