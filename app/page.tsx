"use client";

import { JSX, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";

interface Booking {
  date: string;
  status: "confirmed" | "pending";
  customerName?: string;
}

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
const dayNames = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [bookedDates, setBookedDates] = useState<Booking[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchBookings() {
      const snapshot = await getDocs(collection(db, "bookings"));
      const dates: Booking[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const d = doc.data();
        return {
          date: d.date,
          status: d.status,
          customerName: d.customerName,
        };
      }).filter(
        (b) => b.date && (b.status === "confirmed" || b.status === "pending")
      );
      setBookedDates(dates);
    }
    fetchBookings();
  }, []);

  function renderDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: JSX.Element[] = [];

    // رؤوس الأيام المحسنة
    for (let d = 0; d < 7; d++) {
      days.push(
        <div key={"header-" + d} className="calendar-day header">
          <span className="day-header-icon" style={{ fontSize: '0.8rem' }}>
            {d === 5 ? "🕌" : d === 6 ? "🌙" : "📅"}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{dayNames[d]}</span>
        </div>
      );
    }

    // 42 يوم (6 أسابيع)
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const y = cellDate.getFullYear();
      const m = (cellDate.getMonth() + 1).toString().padStart(2, "0");
      const day = cellDate.getDate().toString().padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const booking = bookedDates.find(b => b.date === dateStr);

      let className = "calendar-day";
      if (cellDate.getMonth() !== month) className += " other-month";
      if (cellDate.toDateString() === today.toDateString()) className += " today";
      if (booking?.status === "confirmed") className += " booked";
      else if (booking?.status === "pending") className += " pending";
      else if (cellDate >= today && cellDate.getMonth() === month) className += " available";

      const handleClick = () => {
        if (booking) {
          const statusText = booking.status === "confirmed" ? "محجوز" : "في الانتظار";
          const statusIcon = booking.status === "confirmed" ? "🔒" : "⏳";
          
          toast.error(`${statusIcon} هذا اليوم ${statusText} مسبقًا`, { 
            duration: 3500,
            style: {
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }
          });
        } else if (cellDate >= today && cellDate.getMonth() === month) {
          toast.success(`🎯 تم اختيار ${dateStr} للحجز`, {
            duration: 2000,
            style: {
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#1e293b',
              borderRadius: '12px',
              border: '1px solid rgba(79, 172, 254, 0.3)',
              backdropFilter: 'blur(10px)'
            }
          });
          setTimeout(() => {
            router.push(`/booking?date=${dateStr}`);
          }, 1000);
        }
      };

      const isAvailable = !booking && cellDate >= today && cellDate.getMonth() === month;
      const isPast = cellDate < today;

      days.push(
        <div
          key={dateStr}
          className={className}
          title={
            booking
              ? booking.status === "confirmed"
                ? "محجوز ✅"
                : "في الانتظار ⏳"
              : isPast 
                ? "تاريخ منتهي"
                : "متاح للحجز 🎯"
          }
          onClick={handleClick}
          style={{ 
            cursor: booking ? "not-allowed" : isPast ? "not-allowed" : "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span className="day-number">{cellDate.getDate()}</span>
          
          {/* أيقونات الحالة */}
          {booking && (
            <span style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              fontSize: "0.7rem"
            }}>
              {booking.status === "confirmed" ? "🔒" : "⏳"}
            </span>
          )}
          
          {isAvailable && (
            <span style={{
              position: "absolute",
              top: "2px",
              left: "2px",
              fontSize: "0.7rem"
            }}>
              🎯
            </span>
          )}
        </div>
      );
    }
    return days;
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      <Toaster position="top-center" />
      
      {/* Header محسن */}
      <header className="text-center py-8" style={{ 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(79, 172, 254, 0.8), transparent)'
        }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem' }}>🏖️</span>
          <h1 className="text-3xl font-bold">شالية الأحلام</h1>
          <span style={{ fontSize: '3rem' }}>🌊</span>
        </div>
        
        <p className="text-lg mb-6" style={{ color: '#94a3b8' }}>
          احجز شاليتك بسهولة ويسر في أجمل الأوقات
        </p>
      </header>

      {/* تقويم محسن */}
      <section className="calendar-container my-8">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.75rem', 
          marginBottom: '1.5rem' 
        }}>
          <span style={{ fontSize: '1.5rem' }}>📅</span>
          <h2 className="text-xl font-semibold">تقويم التوفر</h2>
        </div>
        
        <div className="calendar-header flex justify-between items-center mb-6">
          <button 
            className="nav-btn" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>⬅️</span>
            <span>السابق</span>
          </button>
          
          <h3 id="currentMonth" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '1.4rem',
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

        <div className="calendar-legend flex justify-center gap-4 mb-6">
          <span className="legend-item">
            <span className="dot available"></span>
            <span>متاح 🎯</span>
          </span>
          <span className="legend-item">
            <span className="dot booked"></span>
            <span>محجوز 🔒</span>
          </span>
          <span className="legend-item">
            <span className="dot pending"></span>
            <span>في الانتظار ⏳</span>
          </span>
        </div>
        
        <div className="calendar-grid grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(79, 172, 254, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(79, 172, 254, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💡</span>
            <span>اضغط على اليوم المتاح للحجز</span>
          </div>
        </div>
      </section>

      {/* أزرار الإجراءات المحسنة */}
      <div className="flex justify-center gap-4 my-8 flex-wrap">
        <a 
          href="/booking" 
          className="booking-btn"
          style={{
            textDecoration: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)'
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>🎯</span>
          <span>احجز الآن</span>
        </a>
        
        <a 
          href="/admin" 
          className="admin-btn"
          style={{
            textDecoration: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>⚙️</span>
          <span>لوحة الإدارة</span>
        </a>
      </div>

      {/* سجل الحجوزات للعملاء */}
      <div className="flex justify-center my-6">
        <Link 
          href="/history" 
          className="admin-btn"
          style={{
            textDecoration: 'none',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#1e293b',
            boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
          }}
        >
          <span>📋</span>
          تتبع حجزي
        </Link>
      </div>

      {/* معلومات إضافية */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>معلومات الحجز</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(79, 172, 254, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(79, 172, 254, 0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#4facfe' }}>حجز سريع</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              احجز في دقائق معدودة
            </p>
          </div>
          
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#22c55e' }}>آمن ومضمون</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              بياناتك محمية بأعلى معايير الأمان
            </p>
          </div>
          
          <div style={{
            background: 'rgba(250, 112, 154, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(250, 112, 154, 0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#fa709a' }}>إشعارات فورية</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              تأكيد فوري عبر واتساب
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}