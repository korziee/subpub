# tRPC

## Shared

```TypeScript
type Message = {
  data: string,
  receiptId: string,
  deliveryAttempts: number
}
```

## Router

```TypeScript
PublishToTopic({
  topicName: string,
  messageData: string
}): Promise<string>; // messageId

GetMessages({
  subscriptionName: string,
  batchSize: number
}): Promise<Message[]>

Ack({
  receiptId: string,
}): Promise<void>

ModifyAckDeadline({
  receiptId: string,
  deadlineMilliseconds: number
}): Promise<void>

```

# Config

```TypeScript
type Config = {
  topics: Array<{
    name: string,
    subscriptions: Array<{
      name: string,
      partitions: Array<{
        key: string,
        // hostname, route, etc.
        node: string
      }>
    }>
  }>
}
```

## Internal

```TypeScript
EnqueueSubscriptionMessage({
  subscriptionId: string,
  partitionKey: string,
  messageId: string,
  messageData: string
}): Promise<void>

GetMessages({
  subscriptionId: string,
  partitionKey: string,
  batchSize: number
}): Promise<Message[]>

Ack({
  subscriptionId: string,
  partitionKey: string,
  messageId: string
}): Promise<void>

ModifyAckDeadline({
  subscriptionId: string,
  partitionKey: string,
  messageId: string,
  deadlineMilliseconds: number
}): Promise<void>

GetPartitionStatistics({
  subscriptionId: string,
  partitionKey: string
}): Promise<{
  pendingMessageCount: number,
  inflightMessageCount: number,
  oldestMessageDate: Date
}>
```
