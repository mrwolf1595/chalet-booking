"use client";

import { JSX, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Booking {
  date: string;
  status: "confirmed" | "pending" | "cancelled";
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
    async function fetchBookings() {
      const snapshot = await getDocs(collection(db, "bookings"));
      const arr: Booking[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.date) arr.push({
          date: d.date,
          status: d.status,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          nationalId: d.nationalId,
          depositAmount: d.depositAmount,
          totalAmount: d.totalAmount,
        });
      });
      setBookings(arr);
    }
    fetchBookings();
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
          <span className="day-header-icon" style={{ fontSize: '0.8rem' }}>
            {d === 5 ? "🕌" : d === 6 ? "🌙" : "📅"}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{dayNames[d]}</span>
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
      const pendingCount = dayBookings.filter(b => b.status === "pending").length;
      const confirmedCount = dayBookings.filter(b => b.status === "confirmed").length;

      let className = "admin-calendar-day";
      if (cellDate.getMonth() !== month) className += " other-month";
      if (cellDate.toDateString() === (new Date()).toDateString()) className += " today";
      if (pendingCount > 0) className += " has-pending";
      else if (confirmedCount > 0) className += " has-bookings";

      let title = "";
      if (count > 0) {
        title = `مؤكد: ${confirmedCount} | معلق: ${pendingCount} | جميع الحجوزات: ${count}`;
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e' }}>
                <span>✅</span>
                <span>مؤكدة: {confirmedCount}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                <span>⏳</span>
                <span>معلقة: {pendingCount}</span>
              </div>
            )}
          </div>
        );

        toast.custom(() => customToast, { duration: 3000 });
        setDayDetails({ date: dateStr, bookings: dayBookings });
      };

      days.push(
        <div
          key={dateStr}
          className={className}
          style={{ cursor: count > 0 ? "pointer" : "default", position: "relative" }}
          title={title}
          onClick={handleClick}
        >
          <div className="day-number">{cellDate.getDate()}</div>
          
          {/* عدادات الحالات المحسنة */}
          {pendingCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "#1e293b",
                borderRadius: 12,
                fontSize: "0.7rem",
                padding: "2px 6px",
                zIndex: 2,
                fontWeight: "700",
                border: "1px solid rgba(250, 112, 154, 0.3)",
                boxShadow: "0 2px 8px rgba(250, 112, 154, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "2px"
              }}
            >
              ⏳ {pendingCount}
            </span>
          )}
          {confirmedCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "#1e293b",
                borderRadius: 12,
                fontSize: "0.7rem",
                padding: "2px 6px",
                zIndex: 2,
                fontWeight: "700",
                border: "1px solid rgba(79, 172, 254, 0.3)",
                boxShadow: "0 2px 8px rgba(79, 172, 254, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "2px"
              }}
            >
              ✅ {confirmedCount}
            </span>
          )}
        </div>
      );
    }
    return days;
  }

  return (
    <section className="admin-calendar-section my-6">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <h2 className="text-center">تقويم الحجوزات التفصيلي</h2>
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

      {/* شريط الإحصائيات السريعة */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: '#1e293b',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
        }}>
          <span>✅</span>
          <span>مؤكدة: {bookings.filter(b => b.status === "confirmed").length}</span>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: '#1e293b',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
        }}>
          <span>⏳</span>
          <span>معلقة: {bookings.filter(b => b.status === "pending").length}</span>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
        }}>
          <span>❌</span>
          <span>ملغية: {bookings.filter(b => b.status === "cancelled").length}</span>
        </div>
      </div>
      
      <div id="admin-calendar-grid" className="admin-calendar-grid grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
      
      {/* نافذة تفاصيل اليوم المحسنة */}
      {dayDetails && (
        <div className="modal fixed z-50 inset-0 flex items-center justify-center" onClick={() => setDayDetails(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex justify-between items-center">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <h3>تفاصيل يوم {dayDetails.date}</h3>
              </div>
              <button className="close" onClick={() => setDayDetails(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {dayDetails.bookings.length === 0 ? (
                <div className="text-center" style={{ 
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '3rem' }}>📅</span>
                  <span>لا توجد حجوزات في هذا اليوم</span>
                </div>
              ) : (
                dayDetails.bookings.map((b, idx) => (
                  <div key={idx} className="modal-booking-item mb-4 p-4 rounded" style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    {/* شريط الحالة */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: b.status === "confirmed" 
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : b.status === "pending"
                        ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                        : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                      borderRadius: '12px 12px 0 0'
                    }}></div>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>👤</span>
                        <strong>العميل:</strong> 
                        <span style={{ color: '#22c55e', fontWeight: '700' }}>{b.customerName}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>📱</span>
                        <strong>الجوال:</strong> 
                        <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{b.customerPhone}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>🆔</span>
                        <strong>رقم الهوية:</strong> 
                        <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{b.nationalId}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>💰</span>
                        <strong>العربون:</strong> 
                        <span style={{ color: '#facc15', fontWeight: '700' }}>{b.depositAmount} ريال</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>💵</span>
                        <strong>المبلغ الكلي:</strong> 
                        <span style={{ color: '#eab308', fontWeight: '700' }}>
                          {b.totalAmount ? `${b.totalAmount} ريال` : "—"}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>
                          {b.status === "confirmed" ? "✅" : b.status === "pending" ? "⏳" : "❌"}
                        </span>
                        <strong>الحالة:</strong>
                        <span style={{
                          color: b.status === "confirmed"
                            ? "#22c55e"
                            : b.status === "pending"
                            ? "#f59e0b"
                            : "#ef4444",
                          fontWeight: '700'
                        }}>
                          {b.status === "confirmed"
                            ? "مؤكد"
                            : b.status === "pending"
                            ? "معلق"
                            : "ملغي"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}