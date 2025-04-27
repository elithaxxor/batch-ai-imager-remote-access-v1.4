// In production, use a database. Here, simple in-memory store.
export type AlertEvent = {
  timestamp: number;
  alert: any;
  price: number;
  message: string;
  notifiedUsers: string[];
};

const alertEvents: AlertEvent[] = [];

export function logAlertEvent(event: AlertEvent) {
  alertEvents.push(event);
}

export function getAlertEvents(limit = 100) {
  return alertEvents.slice(-limit).reverse();
}

export function clearAlertEvents() {
  alertEvents.length = 0;
}
