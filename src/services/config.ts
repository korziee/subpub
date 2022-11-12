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
            {
              id: "partition-3",
              node: "node-3",
            },
            {
              id: "partition-4",
              node: "node-4",
            },
            {
              id: "partition-5",
              node: "node-5",
            },
            {
              id: "partition-6",
              node: "node-6",
            },
            {
              id: "partition-7",
              node: "node-7",
            },
            {
              id: "partition-8",
              node: "node-8",
            },
          ],
        },
        // {
        //   name: "numbers-subscription-2",
        //   maxDeliveries: 3,
        //   ackDeadlineMilliseconds: 10 * 1000,
        //   partitions: [
        //     {
        //       id: "partition-1",
        //       node: "node-1",
        //     },
        //     {
        //       id: "partition-2",
        //       node: "node-2",
        //     },
        //   ],
        // },
      ],
    },
  ],
};
