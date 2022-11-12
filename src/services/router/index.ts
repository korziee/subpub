import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

export type RouterRouter = typeof router;

const t = initTRPC.create();

const router = t.router({
  zod: t.procedure.input(z.object({ name: z.string() })).mutation((req) => {
    return req.input.name;
  }),
  greet: t.procedure
    .input((val: unknown) => {
      if (typeof val === "string") return val;
      throw new Error(`Invalid input: ${typeof val}`);
    })
    .query(({ input }) => ({ greeting: `hello, ${input}!` })),
});

createHTTPServer({
  router,
  createContext() {
    return {};
  },
}).listen(2022);
