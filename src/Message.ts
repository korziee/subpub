export interface Message {
  id: string;
  data: string;
  // subscription-id:partition-id:message-id
  receiptId: string;
  deliveryAttempts: number;

  createdDate: number; // unix ms
  ackDeadline?: number; // unix ms
}
