import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";

import type { SubscriptionNodeRouter } from "../subscription-node";
import { Config, config } from "../config";

const nodeIds = new Set<string>();
const subscriptions = new Map<
  string,
  Config["topics"][0]["subscriptions"][0]
>();

config.topics.forEach((topic) => {
  topic.subscriptions.forEach((sub) => {
    subscriptions.set(sub.name, sub);

    sub.partitions.forEach((part) => {
      nodeIds.add(part.node);
    });
  });
});

const nodes = new Map<
  string,
  ReturnType<typeof createTRPCProxyClient<SubscriptionNodeRouter>>
>();

[...nodeIds.values()].map((node) => {
  nodes.set(
    node,
    createTRPCProxyClient<SubscriptionNodeRouter>({
      links: [
        httpBatchLink({
          url: `http://sub-${node}:2022`,
        }),
      ],
    })
  );
});

async function printPartitionStats() {
  console.log("-------------------------------------------------------");
  for (const subscription of subscriptions.values()) {
    for (const partition of subscription.partitions) {
      const node = nodes.get(partition.node);

      const stats = await node!.getPartitionStatistics.query({
        subscriptionName: subscription.name,
        partitionId: partition.id,
      });

      console.log(
        `${subscription.name}:${partition.id}\n\t - Messages in flight: ${
          stats.inflightMessagesCount
        }\n\t - Pending messages: ${
          stats.pendingMessagesCount
        }\n\t - Oldest message: ${
          stats.oldestMessageTimestamp === null
            ? "-"
            : new Date(stats.oldestMessageTimestamp).toISOString()
        }`
      );
    }
  }
  console.log("-------------------------------------------------------");

  setTimeout(() => printPartitionStats(), 2000);
}

printPartitionStats().catch(console.error);

// api
// ---------------------
export type MonitoringRouter = typeof monitoringRouter;

const t = initTRPC.create();

const monitoringRouter = t.router({
  getStats: t.procedure.query(async (req) => {
    const allStats: any = [];

    for (const subscription of subscriptions.values()) {
      for (const partition of subscription.partitions) {
        const node = nodes.get(partition.node);

        const stats = await node!.getPartitionStatistics.query({
          subscriptionName: subscription.name,
          partitionId: partition.id,
        });
        allStats.push({
          subscriptionName: subscription.name,
          partitionId: partition.id,
          node: partition.node,
          stats,
        });
      }
    }

    return allStats;
  }),
});

createHTTPServer({
  router: monitoringRouter,
  createContext() {
    return {};
  },
  onError: (err) => {
    console.error("Error on maintenance Node", err);
  },
}).listen(2022);
