"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";

import AdminActionPanel from "@/components/admin/AdminActionPanel";
import AdminBookingList from "@/components/admin/AdminBookingList";
import AdminStatsOverview from "@/components/admin/AdminStatsOverview";
import { db } from "@/lib/firebase";
import { DashboardBooking } from "@/types/admin";

import AdminCalendar from "./AdminCalendar";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const bookingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(bookingsQuery);
    const nextBookings: DashboardBooking[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== "cancelled") {
        nextBookings.push({
          docId: docSnap.id,
          bookingId: data.bookingId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          nationalId: data.nationalId,
          date: data.date,
          depositAmount: data.depositAmount,
          totalAmount: data.totalAmount,
          apiKey: data.apiKey,
          status: data.status,
        });
      }
    });

    setBookings(nextBookings);
    setLoading(false);
  }

  async function sendWhatsAppNotification(
    phone: string,
    apiKey: string,
    bookingId: string
  ) {
    const fullPhone = phone.startsWith("05") ? `966${phone.slice(1)}` : phone;
    const message = `🎉 تم تأكيد حجزك لدى شالية 5 نجوم\nرقم الحجز: ${bookingId}\nشكراً لاختيارك لنا!`;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, message, apiKey }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success || data.ok || res.status === 200) {
          toast.success("تم إرسال إشعار واتساب للعميل بنجاح ✅📱", {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "#1e293b",
              borderRadius: "12px",
            },
          });
        } else {
          toast.success("تم إرسال إشعار واتساب للعميل 📱", {
            duration: 3000,
            style: {
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "#1e293b",
              borderRadius: "12px",
            },
          });
        }
      } else {
        toast.error("تعذر إرسال رسالة واتساب. تحقق من مفتاح apiKey أو التفعيل 🔧", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
            color: "#fff",
            borderRadius: "12px",
          },
        });
      }
    } catch (error) {
      console.error("WhatsApp API Network Error:", error);
      toast.error("تعذر الاتصال بخدمة واتساب. تحقق من الاتصال بالإنترنت 🌐", {
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
          color: "#fff",
          borderRadius: "12px",
        },
      });
    }
  }

  async function deleteBooking(docId: string, bookingId: string) {
    try {
      await deleteDoc(doc(db, "bookings", docId));

      toast.success(`تم حذف الحجز ${bookingId} نهائياً من النظام 🗑️`, {
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "#fff",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      });

      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("حدث خطأ أثناء حذف الحجز. حاول مرة أخرى 🔄", {
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
          color: "#fff",
          borderRadius: "12px",
        },
      });
    }
  }

  async function updateStatus(
    docId: string,
    newStatus: "confirmed" | "cancelled",
    totalAmount?: number
  ) {
    const booking = bookings.find((item) => item.docId === docId);

    if (newStatus === "confirmed") {
      if (!booking?.totalAmount || booking.totalAmount < booking.depositAmount) {
        toast.error("يرجى إدخال المبلغ الكلي أولًا (أكبر أو يساوي العربون) 💰");
        return;
      }
    }

    if (newStatus === "cancelled") {
      if (booking) {
        await deleteBooking(docId, booking.bookingId);
      }
      return;
    }

    await updateDoc(doc(db, "bookings", docId), {
      status: newStatus,
      ...(totalAmount !== undefined && { totalAmount }),
    });

    toast.success("تم التأكيد بنجاح ✅");

    if (
      newStatus === "confirmed" &&
      booking &&
      booking.apiKey &&
      booking.customerPhone
    ) {
      sendWhatsAppNotification(
        booking.customerPhone,
        booking.apiKey,
        booking.bookingId
      );
    }

    fetchBookings();
  }

  async function downloadBookingAsPNG(docId: string) {
    const node = bookingRefs.current[docId];
    if (!node) {
      return;
    }

    toast.loading("جاري إنشاء الصورة... 📸");

    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#23242b",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `booking-details-${docId}.png`;
      link.click();
      toast.dismiss();
      toast.success("تم تحميل الصورة بنجاح 🖼️");
    } catch {
      toast.dismiss();
      toast.error("حدث خطأ أثناء إنشاء الصورة");
    }
  }

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  const registerBookingRef = useCallback(
    (docId: string, node: HTMLDivElement | null) => {
      if (node) {
        bookingRefs.current[docId] = node;
      } else {
        delete bookingRefs.current[docId];
      }
    },
    []
  );

  const handleUpdateTotalAmount = (docId: string, totalAmount?: number) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.docId === docId ? { ...booking, totalAmount } : booking
      )
    );
  };

  const handleConfirmBooking = (docId: string, totalAmount?: number) => {
    updateStatus(docId, "confirmed", totalAmount);
  };

  const handleDeleteBooking = (docId: string) => {
    updateStatus(docId, "cancelled");
  };

  const handleDownloadBooking = (docId: string) => {
    downloadBookingAsPNG(docId);
  };

  return (
    <div className="admin-shell">
      <AdminCalendar />
      <AdminStatsOverview total={totalBookings} confirmed={confirmedBookings} />
      <AdminActionPanel onRefresh={fetchBookings} onLogout={onLogout} />
      <AdminBookingList
        bookings={bookings}
        loading={loading}
        registerBookingRef={registerBookingRef}
        onUpdateTotalAmount={handleUpdateTotalAmount}
        onConfirmBooking={handleConfirmBooking}
        onDeleteBooking={handleDeleteBooking}
        onDownloadBooking={handleDownloadBooking}
      />
    </div>
  );
}