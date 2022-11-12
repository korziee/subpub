import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

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

  setTimeout(() => printPartitionStats(), 100);
}

printPartitionStats().catch(console.error);
