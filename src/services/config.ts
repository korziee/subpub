export type Config = {
  topics: Array<{
    name: string;
    subscriptions: Array<{
      name: string;
      partitions: Array<{
        key: string;
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
          partitions: [
            {
              key: "partition-1",
              node: "node-1",
            },
            {
              key: "partition-2",
              node: "node-2",
            },
          ],
        },
        {
          name: "numbers-subscription-2",
          partitions: [
            {
              key: "partition-1",
              node: "node-1",
            },
          ],
        },
      ],
    },
  ],
};
