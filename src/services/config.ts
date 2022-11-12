export type Config = {
  topics: Array<{
    name: string;
    subscriptions: Array<{
      name: string;
      maxDeliveries: number;
      ackDeadlineMilliseconds: number;
      partitions: Array<{
        id: string;
        // hostname, route, etc.
        node: string;
      }>;
    }>;
  }>;
};

export const config: Config = {
  topics: [
    {
      name: "numbers-topic",
      subscriptions: [
        {
          name: "numbers-subscription-1",
          maxDeliveries: 3,
          ackDeadlineMilliseconds: 10 * 1000,
          partitions: [
            {
              id: "partition-1",
              node: "node-1",
            },
            {
              id: "partition-2",
              node: "node-2",
            },
          ],
        },
        {
          name: "numbers-subscription-2",
          maxDeliveries: 3,
          ackDeadlineMilliseconds: 10 * 1000,
          partitions: [
            {
              id: "partition-1",
              node: "node-1",
            },
            {
              id: "partition-2",
              node: "node-2",
            },
          ],
        },
      ],
    },
  ],
};
