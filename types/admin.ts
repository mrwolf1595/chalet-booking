export interface DashboardBooking {
  docId: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  date: string;
  depositAmount: number;
  totalAmount?: number;
  apiKey?: string;
  status: "pending" | "confirmed" | "cancelled";
}
