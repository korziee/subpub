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
        id: string,
        // hostname, route, etc.
        node: string
      }>
    }>
  }>
}
```

## Internal

```TypeScript
EnqueueSubscriptionMessages({
  subscriptionId: string,
  partitionId: string,
  messageId: string,
  messageData: string
}): Promise<void>

GetMessages({
  subscriptionId: string,
  partitionId: string,
  batchSize: number
}): Promise<Message[]>

Ack({
  subscriptionId: string,
  partitionId: string,
  messageId: string
}): Promise<void>

ModifyAckDeadline({
  subscriptionId: string,
  partitionId: string,
  messageId: string,
  deadlineMilliseconds: number
}): Promise<void>

GetPartitionStatistics({
  subscriptionId: string,
  partitionId: string
}): Promise<{
  pendingMessageCount: number,
  inflightMessageCount: number,
  oldestMessageDate: Date
}>
```
