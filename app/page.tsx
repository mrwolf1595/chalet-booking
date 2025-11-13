"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  DocumentData,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

import HeroSection from "@/components/home/HeroSection";
import InfoBanner from "@/components/home/InfoBanner";
import CalendarSummary from "@/components/home/CalendarSummary";
import CalendarNavigation from "@/components/home/CalendarNavigation";
import CalendarLegend from "@/components/home/CalendarLegend";
import CalendarGrid from "@/components/home/CalendarGrid";
import CalendarHint from "@/components/home/CalendarHint";
import ActionLinks from "@/components/home/ActionLinks";
import FeatureGrid from "@/components/home/FeatureGrid";
import { db } from "@/lib/firebase";
import { getCurrentHijriDate } from "@/lib/hijri";
import {
  CalendarBooking,
  CalendarInteractionEvent,
} from "@/types/calendar";

const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<CalendarBooking[]>([]);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function fetchAndCleanBookings() {
      const snapshot = await getDocs(collection(db, "bookings"));
      const now = new Date();
      now.setSeconds(0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextBookings: CalendarBooking[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        if (data.date && data.status === "confirmed") {
          const [y, m, d] = data.date.split("-").map(Number);
          const bookingDate = new Date(y, m - 1, d);
          bookingDate.setHours(0, 0, 0, 0);

          const isPastDay = bookingDate < today;
          const isSameDay = bookingDate.getTime() === today.getTime();
          const passedCutoff = isSameDay && now.getHours() >= 15;

          if (!isPastDay && !passedCutoff) {
            nextBookings.push({
              date: data.date,
              status: data.status,
              customerName: data.customerName,
            });
          }
        }
      });

      if (isMounted) {
        setBookedDates(nextBookings);
      }
    }

    fetchAndCleanBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCalendarInteraction = useCallback(
    (event: CalendarInteractionEvent) => {
      if (event.type === "booked") {
        toast.error("🔒 هذا اليوم محجوز مسبقًا", {
          duration: 3500,
          style: {
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#fff",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          },
        });
        return;
      }

      if (event.type === "available") {
        toast.success(`🎯 تم اختيار ${event.dateStr} للحجز`, {
          duration: 2000,
          style: {
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "#1e293b",
            borderRadius: "12px",
            border: "1px solid rgba(79, 172, 254, 0.3)",
            backdropFilter: "blur(10px)",
          },
        });

        setTimeout(() => {
          router.push(`/booking?date=${event.dateStr}`);
        }, 1000);
      }
    },
    [router]
  );

  const formattedGregorian = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedHijri = getCurrentHijriDate();
  const monthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  return (
    <main className="home-shell">
      <Toaster position="top-center" />

      <HeroSection />
      <InfoBanner />

      <section id="calendar" className="calendar-section">
        <CalendarSummary
          gregorianDate={formattedGregorian}
          hijriDate={formattedHijri}
        />

        <CalendarNavigation
          monthLabel={monthLabel}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />

        <CalendarLegend />

        <CalendarGrid
          currentDate={currentDate}
          bookedDates={bookedDates}
          onInteraction={handleCalendarInteraction}
        />

        <CalendarHint />
      </section>

      <ActionLinks />
      <FeatureGrid />
    </main>
  );
}
