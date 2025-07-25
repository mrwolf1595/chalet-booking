"use client";

import { JSX, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, deleteDoc, doc as fbDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { getFullHijriDate, getCurrentHijriDate } from "@/lib/hijri";

interface Booking {
  date: string;
  status: "confirmed";
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
    async function fetchAndCleanBookings() {
      const snapshot = await getDocs(collection(db, "bookings"));
      const now = new Date();
      now.setSeconds(0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const arr: Booking[] = [];
      const deletePromises: Promise<void>[] = [];

      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const d = docSnap.data();
        if (d.date && d.status === "confirmed") {
          const [y, m, day] = d.date.split("-").map(Number);
          const bookingDate = new Date(y, m - 1, day);
          bookingDate.setHours(0, 0, 0, 0);

          // إذا الحجز أقدم من اليوم أو اليوم الحالي ولكن الساعة >= 15:00 (3 عصراً)
          if (
            bookingDate < today ||
            (bookingDate.getTime() === today.getTime() && now.getHours() >= 15)
          ) {
            // حذف من فايربيز
            deletePromises.push(deleteDoc(fbDoc(db, "bookings", docSnap.id)));
          } else {
            arr.push({
              date: d.date,
              status: d.status,
              customerName: d.customerName,
            });
          }
        }
      });

      await Promise.all(deletePromises);
      setBookedDates(arr);
    }
    fetchAndCleanBookings();
  }, []);

  function renderDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

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
      cellDate.setHours(0, 0, 0, 0);
      const y = cellDate.getFullYear();
      const m = (cellDate.getMonth() + 1).toString().padStart(2, "0");
      const day = cellDate.getDate().toString().padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const booking = bookedDates.find(b => b.date === dateStr);

      let className = "calendar-day";
      if (cellDate.getMonth() !== month) className += " other-month";
      if (cellDate.getTime() === new Date().setHours(0, 0, 0, 0)) className += " today";

      // منطق إتاحة اليوم الحالي حتى الساعة 3 فقط
      const isToday = cellDate.getTime() === now.setHours(0, 0, 0, 0);
      const beforeCutoff = isToday && now.getHours() < 15;
      const afterCutoff = isToday && now.getHours() >= 15;

      if (booking?.status === "confirmed") className += " booked";
      else if (
        // اليوم الحالي متاح قبل 3 عصرًا أو أي يوم مستقبلي
        ((isToday && beforeCutoff) || cellDate > today)
        && cellDate.getMonth() === month
      ) {
        className += " available";
      }

      const handleClick = () => {
        if (booking) {
          toast.error(`🔒 هذا اليوم محجوز مسبقًا`, {
            duration: 3500,
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }
          });
        } else if (
          // اليوم الحالي متاح فقط قبل الساعة 3
          ((isToday && beforeCutoff) || (cellDate > today))
          && cellDate.getMonth() === month
        ) {
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

      const isAvailable =
        !booking &&
        ((isToday && beforeCutoff) || (cellDate > today))
        && cellDate.getMonth() === month;

      const isPast =
        cellDate < today ||
        (isToday && afterCutoff);

      const hijriDate = getFullHijriDate(cellDate);

      days.push(
        <div
          key={dateStr}
          className={className}
          title={
            booking
              ? "محجوز 🔒"
              : isPast
                ? "تاريخ منتهي"
                : "متاح للحجز 🎯"
          }
          onClick={handleClick}
          style={{
            cursor: isAvailable ? "pointer" : "not-allowed",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.25rem"
          }}
        >
          <span className="day-number" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            {cellDate.getDate()}
          </span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8, textAlign: 'center', lineHeight: '1.1' }}>
            {hijriDate.split(' ')[0]} {hijriDate.split(' ')[1]}
          </span>
          {booking && (
            <span style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              fontSize: "0.7rem"
            }}>
              🔒
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

  const todayGregorian = new Date();
  const todayHijri = getCurrentHijriDate();

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      <Toaster position="top-center" />

      {/* باقي عناصر الصفحة كما هي بالضبط بدون أي نقص */}
      {/* ... (لا تغير على JSX والـ CSS والتنسيقات) ... */}

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
          <h1 className="text-3xl font-bold">شالية 5 نجوم</h1>
          <span style={{ fontSize: '3rem' }}>🌊</span>
        </div>

        <p className="text-lg mb-6" style={{ color: '#94a3b8' }}>
          احجز شاليتك بسهولة ويسر في أجمل الأوقات
        </p>
      </header>

      {/* الجملة التوضيحية قبل التاريخ الميلادي */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        padding: '0.8rem 0.5rem',
        background: 'rgba(34,197,255,0.07)',
        borderRadius: '12px',
        border: '1px solid #e0e7ef',
        fontWeight: 600,
        fontSize: '1.07rem',
        color: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.7rem'
      }}>
        <span>ℹ️</span>
        للحجز قم بالضغط على اليوم الذي تريده، مع العلم أن <span style={{ color: '#ef4444', fontWeight: 800 }}>اللون الأحمر 🔒 محجوز</span> و
        <span style={{ color: '#22d3ee', fontWeight: 800 }}>اللون السماوي 🎯 متاح للحجز</span>
      </div>

      {/* تقويم محسن */}
      <section className="calendar-container my-8">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
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
            <span className="dot booked" style={{ backgroundColor: '#ef4444' }}></span>
            <span>محجوز 🔒</span>
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

      {/* باقي الأكواد كما هي */}
      <div className="flex justify-center gap-4 my-8 flex-wrap">
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
