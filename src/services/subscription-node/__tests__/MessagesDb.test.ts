import { MessagesDb } from "../MessagesDb";

const dummySubscriptionConfig = {
  name: "subscription-1",
  maxDeliveries: 3,
  partitions: [],
  ackDeadlineMilliseconds: 10 * 1000,
};

describe("MessagesDb", () => {
  it("Enqueues and recieves messages", () => {
    jest.useFakeTimers({
      now: new Date("2022-11-12T03:00:00.000Z"),
    });

    const db = new MessagesDb("partition-1", dummySubscriptionConfig);

    db.enqueueMessage("msg-1", "hello");
    const messages = db.getMessages(1);

    expect(messages).toEqual([
      {
        createdDate: new Date("2022-11-12T03:00:00.000Z").getTime(),
        // 10 seconds after received date
        ackDeadline: new Date("2022-11-12T03:00:10.000Z").getTime(),
        data: "hello",
        deliveryAttempts: 0,
        id: "msg-1",
        receiptId: "subscription-1-partition-1-msg-1",
      },
    ]);

    db.destroy();
  });
});
