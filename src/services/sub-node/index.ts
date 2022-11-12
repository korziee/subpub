import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

export type SubNodeRouter = typeof subNodeRouter;

const t = initTRPC.create();

const subNodeRouter = t.router({
  subNodeThing: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation((req) => {
      return req.input.id;
    }),
});

createHTTPServer({
  router: subNodeRouter,
  createContext() {
    return {};
  },
}).listen(2022);
