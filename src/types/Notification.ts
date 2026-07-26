export type NotificationType = "message" | "booking";

// small string-keyed bag — enough to render a line and link back to the entity
export type NotificationPayload = Record<string, string>;

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

export type NewNotification = {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
};
