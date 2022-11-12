// all messages are stored in memory
import { Message } from "../../Message";
import { Config } from "../config";

const DB_MAINTENANCE_PERIOD = 10 * 1000;

export class MessagesDb {
  private pendingMessages: Message[] = []; // stored in order from oldest -> newest
  private inFlightMessages = new Map<string, Message>(); // message id -> message
  public oldestMessageTimestamp: null | number = null; // unix ms

  constructor(
    public partitionId: string,
    public subscriptionConfig: Config["topics"][0]["subscriptions"][0]
  ) {
    // configure timers to perform maintenance
    setInterval(() => this.doMaintenance(), DB_MAINTENANCE_PERIOD);
  }

  public enqueueMessage(messageId: string, messageData: string) {
    const message: Message = {
      id: messageId,
      data: messageData,
      ackDeadline: 0,
      deliveryAttempts: 0,
      createdDate: Date.now(),
      receiptId: `${this.subscriptionConfig.name}-${this.partitionId}-${messageId}`,
    };
    this.pendingMessages.push(message);
  }

  public getMessages(batchSize: number): Message[] {
    const pendingMessagesToSend = this.pendingMessages.splice(0, batchSize);

    // add to inflight messages map
    const now = Date.now();
    for (const message of pendingMessagesToSend) {
      message.ackDeadline =
        now + this.subscriptionConfig.ackDeadlineMilliseconds;

      this.inFlightMessages.set(message.id, message);
    }

    return pendingMessagesToSend;
  }

  public ackMessage(messageId: string) {
    this.inFlightMessages.delete(messageId);
  }

  public modifyMessageAckDeadline(
    messageId: string,
    deadlineMilliseconds: number
  ) {
    const message = this.inFlightMessages.get(messageId);
    if (message === undefined) {
      throw new Error(`message ${messageId} not found`);
    }

    message.ackDeadline = Date.now() + deadlineMilliseconds;
  }

  get pendingMessagesCount() {
    return this.pendingMessages.length;
  }

  get inflightMessagesCount() {
    return this.inFlightMessages.size;
  }

  private doMaintenance() {
    console.log(
      `Performing maintenance for DB: ${this.subscriptionConfig.name}-${this.partitionId}`
    );

    // find elapsed in-flight messages and move them back to the pending items queue
    const now = Date.now();
    for (const message of this.inFlightMessages.values()) {
      if (message.ackDeadline && message.ackDeadline <= now) {
        // message has expired! re-enqueue (at the back of the queue)

        this.inFlightMessages.delete(message.id);

        message.ackDeadline = undefined;
        message.deliveryAttempts += 1;

        if (message.deliveryAttempts >= this.subscriptionConfig.maxDeliveries) {
          console.log(
            `Attempted delivery of message ${message.id} ${message.deliveryAttempts} times, dropping message`
          );
          continue;
        }

        this.pendingMessages.push(message);
      }
    }

    // find oldest pending message (or null if queue empty)
    this.oldestMessageTimestamp =
      this.pendingMessages.length === 0
        ? null
        : Math.min(...this.pendingMessages.map((x) => x.createdDate));
  }
}
