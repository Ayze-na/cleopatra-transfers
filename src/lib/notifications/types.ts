export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  language?: string;
  /** Short identifier of the event, e.g. 'booking_ack' or 'admin_notify_booking'. */
  event?: string;
  /** Related booking/trip id, stored in notification_log for traceability. */
  relatedBookingId?: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  sendEmail(payload: NotificationPayload): Promise<NotificationResult>;
  sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult>;
}
