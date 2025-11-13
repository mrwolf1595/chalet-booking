export interface CalendarBooking {
  date: string;
  status: "confirmed";
  customerName?: string;
}

export type CalendarInteractionType = "booked" | "available";

export interface CalendarInteractionEvent {
  type: CalendarInteractionType;
  dateStr: string;
}
