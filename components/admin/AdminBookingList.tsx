"use client";

import { getFullHijriDate } from "@/lib/hijri";
import { DashboardBooking } from "@/types/admin";

interface AdminBookingListProps {
  bookings: DashboardBooking[];
  loading: boolean;
  registerBookingRef: (docId: string, node: HTMLDivElement | null) => void;
  onUpdateTotalAmount: (docId: string, totalAmount?: number) => void;
  onConfirmBooking: (docId: string, totalAmount?: number) => void;
  onDeleteBooking: (docId: string) => void;
  onDownloadBooking: (docId: string) => void;
}

const AdminBookingList = ({
  bookings,
  loading,
  registerBookingRef,
  onUpdateTotalAmount,
  onConfirmBooking,
  onDeleteBooking,
  onDownloadBooking,
}: AdminBookingListProps) => {
  if (loading) {
    return (
      <div className="admin-booking-list__state admin-booking-list__state--loading">
        <div className="loading-spinner" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="admin-booking-list__state admin-booking-list__state--empty">
        <span className="admin-booking-list__emoji">📋</span>
        <p>لا توجد حجوزات نشطة</p>
        <span>الحجوزات الملغية يتم حذفها تلقائياً</span>
      </div>
    );
  }

  return (
    <div className="admin-booking-list">
      <header className="admin-booking-list__header">
        <span>📋</span>
        <h2>الحجوزات النشطة</h2>
        <div className="admin-booking-list__badge">الملغية تُحذف فوراً</div>
      </header>

      {bookings.map((booking) => (
        <BookingCard
          key={booking.docId}
          booking={booking}
          registerBookingRef={registerBookingRef}
          onUpdateTotalAmount={onUpdateTotalAmount}
          onConfirmBooking={onConfirmBooking}
          onDeleteBooking={onDeleteBooking}
          onDownloadBooking={onDownloadBooking}
        />
      ))}
    </div>
  );
};

interface BookingCardProps {
  booking: DashboardBooking;
  registerBookingRef: (docId: string, node: HTMLDivElement | null) => void;
  onUpdateTotalAmount: (docId: string, totalAmount?: number) => void;
  onConfirmBooking: (docId: string, totalAmount?: number) => void;
  onDeleteBooking: (docId: string) => void;
  onDownloadBooking: (docId: string) => void;
}

const BookingCard = ({
  booking,
  registerBookingRef,
  onUpdateTotalAmount,
  onConfirmBooking,
  onDeleteBooking,
  onDownloadBooking,
}: BookingCardProps) => {
  const [year, month, day] = booking.date.split("-").map(Number);
  const dateObject = new Date(year, month - 1, day);

  const statusBarClass =
    booking.status === "confirmed"
      ? "admin-booking-card__status-bar admin-booking-card__status-bar--confirmed"
      : "admin-booking-card__status-bar admin-booking-card__status-bar--pending";

  const handleDelete = () => {
    const shouldDelete = window.confirm(
      `هل أنت متأكد من حذف حجز ${booking.bookingId} نهائياً؟\nلا يمكن التراجع عن هذا الإجراء!`
    );

    if (shouldDelete) {
      onDeleteBooking(booking.docId);
    }
  };

  return (
    <article className="admin-booking-card">
      <div
        className="admin-booking-card__body"
        dir="rtl"
        ref={(node) => registerBookingRef(booking.docId, node)}
      >
  <div className={statusBarClass} />

        <dl className="admin-booking-card__grid">
          <div>
            <dt>رقم الحجز</dt>
            <dd className="admin-booking-card__code">{booking.bookingId}</dd>
          </div>
          <div>
            <dt>العميل</dt>
            <dd className="admin-booking-card__customer">{booking.customerName}</dd>
          </div>
          <div>
            <dt>الجوال</dt>
            <dd className="admin-booking-card__code">{booking.customerPhone}</dd>
          </div>
          <div>
            <dt>رقم الهوية</dt>
            <dd className="admin-booking-card__code">{booking.nationalId}</dd>
          </div>
          <div>
            <dt>يوم الحجز</dt>
            <dd>{dateObject.toLocaleDateString("ar-EG", { weekday: "long" })}</dd>
          </div>
          <div>
            <dt>التاريخ الميلادي</dt>
            <dd>{booking.date}</dd>
          </div>
          <div>
            <dt>التاريخ الهجري</dt>
            <dd className="admin-booking-card__hijri">{getFullHijriDate(dateObject)}</dd>
          </div>
          <div>
            <dt>العربون</dt>
            <dd className="admin-booking-card__deposit">{booking.depositAmount} ريال</dd>
          </div>
          <div>
            <dt>المبلغ الكلي</dt>
            <dd className="admin-booking-card__total">
              {booking.totalAmount ? `${booking.totalAmount} ريال` : "—"}
            </dd>
          </div>
          <div>
            <dt>المتبقي</dt>
            <dd className="admin-booking-card__remaining">
              {booking.totalAmount
                ? `${booking.totalAmount - booking.depositAmount} ريال`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>الحالة</dt>
            <dd className={
              booking.status === "confirmed"
                ? "admin-booking-card__status admin-booking-card__status--confirmed"
                : "admin-booking-card__status"
            }>
              {booking.status === "confirmed" ? "🔒 محجوز" : "⏳ في الانتظار"}
            </dd>
          </div>
        </dl>
      </div>

      <footer className="admin-booking-card__actions">
        {booking.status === "pending" && (
          <>
            <label className="admin-booking-card__input-wrap">
              <span>💰</span>
              <input
                type="number"
                min={booking.depositAmount}
                value={booking.totalAmount ?? ""}
                placeholder="إجمالي المبلغ"
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdateTotalAmount(booking.docId, value ? Number(value) : undefined);
                }}
              />
            </label>
            <button
              type="button"
              className="confirm-btn"
              onClick={() => onConfirmBooking(booking.docId, booking.totalAmount)}
            >
              <span>✅</span>
              تأكيد الحجز
            </button>
          </>
        )}

        <button type="button" className="cancel-btn" onClick={handleDelete}>
          <span>🗑️</span>
          حذف الحجز نهائياً
        </button>

        {booking.status === "confirmed" && (
          <button
            type="button"
            className="admin-btn"
            onClick={() => onDownloadBooking(booking.docId)}
          >
            <span>📸</span>
            تحميل صورة
          </button>
        )}
      </footer>
    </article>
  );
};

export default AdminBookingList;
