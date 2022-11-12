import { config } from "../config";
import { MessagesDb } from "./MessagesDb";

const nodeName = process.env.NODE_NAME;

// `${subscriptionName}-${partitionId}` -> MessagesDb
const messageDbs = new Map<string, MessagesDb>();

export function loadPartitionDbs() {
  // find a list of subscriptions & partitions we are responsible
  const mySubscriptionsAndPartitions = config.topics.flatMap((topic) =>
    topic.subscriptions
      .map((subscription) => ({
        subscription,
        myPartitions: subscription.partitions.filter(
          (partition) => partition.node === nodeName
        ),
      }))
      .filter((x) => x.myPartitions.length > 0)
  );

  console.log(
    `Found ${mySubscriptionsAndPartitions.length} subscriptions I'm responsible for`
  );

  // construct a DB for every partition
  for (const subscriptionPartitionConfig of mySubscriptionsAndPartitions) {
    for (const partition of subscriptionPartitionConfig.myPartitions) {
      messageDbs.set(
        `${subscriptionPartitionConfig.subscription.name}-${partition.id}`,
        new MessagesDb(partition.id, subscriptionPartitionConfig.subscription)
      );
    }
  }
}

export function getPartitionDb(
  subscriptionName: string,
  partitionId: string
): MessagesDb {
  const db = messageDbs.get(`${subscriptionName}-${partitionId}`);
  if (db === undefined) {
    throw new Error(`No DB loaded for ${subscriptionName}-${partitionId}`);
  }

  return db;
}
