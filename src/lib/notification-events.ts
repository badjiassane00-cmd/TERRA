"use client";

export const NOTIFICATIONS_UPDATED_EVENT = "terra:notifications-updated";

export function announceNotificationsUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}
