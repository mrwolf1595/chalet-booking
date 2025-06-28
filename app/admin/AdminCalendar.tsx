"use client";

import { JSX, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { getFullHijriDate, getCurrentHijriDate } from "@/lib/hijri";

interface Booking {
  date: string;
  status: "confirmed";
  customerName: string;
  customerPhone: string;
  nationalId: string;
  depositAmount: number;
  totalAmount?: number;
}

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
const dayNames = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dayDetails, setDayDetails] = useState<{ date: string, bookings: Booking[] } | null>(null);

  useEffect(() => {
    async function fetchBookingsAndAutoCancelOld() {
      const snapshot = await getDocs(collection(db, "bookings"));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const arr: Booking[] = [];
      const promises: Promise<void>[] = [];

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d.date && d.status === "confirmed") {
          // قارن التواريخ
          const [y, m, day] = d.date.split("-").map(Number);
          const bookingDate = new Date(y, m - 1, day);
          bookingDate.setHours(0, 0, 0, 0);

          if (bookingDate < today) {
            // إذا قديم: تحديث الحالة في فايربيز
            const ref = doc(db, "bookings", docSnap.id);
            promises.push(updateDoc(ref, { status: "cancelled" }));
          } else {
            arr.push({
              date: d.date,
              status: d.status,
              customerName: d.customerName,
              customerPhone: d.customerPhone,
              nationalId: d.nationalId,
              depositAmount: d.depositAmount,
              totalAmount: d.totalAmount,
            });
          }
        }
      });

      await Promise.all(promises);

      setBookings(arr);
    }

    fetchBookingsAndAutoCancelOld();
  }, []);

  function renderDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const days: JSX.Element[] = [];

    // رؤوس الأيام
    for (let d = 0; d < 7; d++) {
      days.push(
        <div key={"header-" + d} className="admin-calendar-day header">
          <span className="day-header-icon" style={{ fontSize: '0.7rem' }}>
            {d === 5 ? "🕌" : d === 6 ? "🌙" : "📅"}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>{dayNames[d]}</span>
        </div>
      );
    }

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const y = cellDate.getFullYear();
      const m = (cellDate.getMonth() + 1).toString().padStart(2, "0");
      const day = cellDate.getDate().toString().padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const dayBookings = bookings.filter(b => b.date === dateStr);

      const count = dayBookings.length;
      const confirmedCount = dayBookings.filter(b => b.status === "confirmed").length;

      let className = "admin-calendar-day";
      if (cellDate.getMonth() !== month) className += " other-month";
      if (cellDate.toDateString() === (new Date()).toDateString()) className += " today";
      if (confirmedCount > 0) className += " has-bookings";

      let title = "";
      if (count > 0) {
        title = `مؤكد: ${confirmedCount} | جميع الحجوزات: ${count}`;
      }

      const handleClick = () => {
        if (count === 0) return;

        const customToast = (
          <div className="custom-toast" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1rem',
            color: '#f8fafc',
            fontSize: '0.9rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <b>حجوزات {dateStr}</b>
            </div>
            {confirmedCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <span>🔒</span>
                <span>محجوزة: {confirmedCount}</span>
              </div>
            )}
          </div>
        );

        toast.custom(() => customToast, { duration: 3000 });
        setDayDetails({ date: dateStr, bookings: dayBookings });
      };

      const hijriDate = getFullHijriDate(cellDate);

      days.push(
        <div
          key={dateStr}
          className={className}
          style={{
            cursor: count > 0 ? "pointer" : "default",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.25rem",
            minHeight: "70px"
          }}
          title={title}
          onClick={handleClick}
        >
          <div className="day-number" style={{
            fontSize: '1.4rem',
            fontWeight: 'bold',
            color: '#f8fafc',
            marginBottom: '4px',
            zIndex: 3,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            {cellDate.getDate()}
          </div>
          <span style={{
            fontSize: '0.65rem',
            opacity: 0.8,
            textAlign: 'center',
            lineHeight: '1.1',
            color: '#94a3b8',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            fontWeight: '500'
          }}>
            {hijriDate.split(' ')[0]} {hijriDate.split(' ')[1]}
          </span>
          {confirmedCount > 0 && (
            <span
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                borderRadius: 8,
                fontSize: "0.6rem",
                padding: "1px 4px",
                zIndex: 4,
                fontWeight: "700",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                boxShadow: "0 1px 4px rgba(239, 68, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "1px"
              }}
            >
              🔒 {confirmedCount}
            </span>
          )}
        </div>
      );
    }
    return days;
  }

  const todayGregorian = new Date();
  const todayHijri = getCurrentHijriDate();

  return (
    <section className="admin-calendar-section my-6">
      {/* ... باقي عناصر التقويم بدون تغيير ... */}
      {/* انسخ باقي كود الواجهة حسب نسختك الأخيرة من الملف (عرض الهجري، التنقل بين الأشهر، الخ) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textAlign: 'center', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📅</span>
          <h2 className="text-xl font-semibold">التاريخ الميلادي</h2>
        </div>
        <div style={{ fontSize: '1.1rem', color: '#4facfe', fontWeight: '600' }}>
          {todayGregorian.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🌙</span>
          <h2 className="text-xl font-semibold">التاريخ الهجري</h2>
        </div>
        <div style={{ fontSize: '1.1rem', color: '#22c55e', fontWeight: '600' }}>
          {todayHijri}
        </div>
      </div>
      <div className="calendar-header flex justify-between items-center mb-4">
        <button
          className="nav-btn"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>⬅️</span>
          <span>السابق</span>
        </button>
        <h3 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.3rem',
          fontWeight: '700'
        }}>
          <span>🗓️</span>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          className="nav-btn"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>التالي</span>
          <span>➡️</span>
        </button>
      </div>
      <div id="admin-calendar-grid" className="admin-calendar-grid grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
      {/* نافذة تفاصيل اليوم والمودال كما هي */}
      {dayDetails && (
        <div className="modal fixed z-50 inset-0 flex items-center justify-center" onClick={() => setDayDetails(null)}>
          {/* ... نفس الكود ... */}
        </div>
      )}
    </section>
  );
}
