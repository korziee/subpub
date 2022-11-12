export interface StoredMessage {
  data: string;
  deliveryAttempts: number;
}

export interface Message extends StoredMessage {
  // subscription-id:partition-id:message-id
  receiptId: string;
}
