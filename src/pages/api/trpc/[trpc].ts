import * as trpcNext from "@trpc/server/adapters/next";
import { router } from "../../../services/router";

export default trpcNext.createNextApiHandler({
  router,
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      // send to bug reporting
      console.error("Something went wrong", error);
    }
  },
});
