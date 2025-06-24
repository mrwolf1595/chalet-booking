"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";

interface Booking {
  bookingId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  nationalId?: string; // أضف رقم الهوية
  status: "confirmed" | "pending" | "cancelled";
  depositAmount: number;
  totalAmount?: number;
}


export default function BookingHistoryPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [results, setResults] = useState<Booking[] | null>(null);

  // تحميل كل الحجوزات لمرة واحدة
  useEffect(() => {
    async function fetchAllBookings() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "bookings"));
        const arr: Booking[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          arr.push({
            bookingId: d.bookingId,
            date: d.date,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            status: d.status,
            depositAmount: d.depositAmount,
            totalAmount: d.totalAmount
          });
        });
        setAllBookings(arr);
      } catch {
        toast.error("خطأ في تحميل الحجوزات");
      } finally {
        setLoading(false);
      }
    }
    fetchAllBookings();
  }, []);

  // البحث اللحظي (client-side)
  useEffect(() => {
    if (!name && !phone) {
      setResults(null);
      return;
    }
    const n = name.trim();
    const p = phone.trim();
    const filtered = allBookings.filter(b =>
      (n && b.customerName && b.customerName.includes(n)) ||
      (p && b.customerPhone && b.customerPhone.includes(p))
    );
    setResults(filtered);
  }, [name, phone, allBookings]);

  return (
    <main>
      <Toaster position="top-center" />
      <header className="text-center py-8">
        <h1 className="text-2xl font-bold mb-2">سجل الحجوزات</h1>
        <p className="text-gray-400 mb-4">ابحث باسمك أو رقم جوالك وستظهر النتائج مباشرة</p>
      </header>
      <form className="max-w-lg mx-auto bg-[#181820] rounded-xl p-6 shadow mb-8">
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-[#8ecae6]" htmlFor="name">الاسم:</label>
          <input
            id="name"
            className="input w-full"
            type="text"
            value={name}
            autoComplete="off"
            style={{ background: "#111112", color: "#fff", borderColor: "#43e97b" }}
            onChange={e => setName(e.target.value.replace(/[0-9!@#$%^&*()_+=\[\]{};:'",.<>\/?\\|-]/g, ""))}
            placeholder="اكتب اسمك بالكامل (بحث فوري)"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-[#8ecae6]" htmlFor="phone">رقم الجوال:</label>
          <input
            id="phone"
            className="input w-full"
            type="tel"
            value={phone}
            autoComplete="off"
            style={{ background: "#111112", color: "#fff", borderColor: "#43e97b" }}
            onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            placeholder="05xxxxxxxx (بحث فوري)"
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">
          البحث تلقائي عند إدخال أي حقل
        </div>
      </form>
      {loading && (
        <div className="text-center text-[#43e97b] mb-3 font-bold">...جاري التحميل</div>
      )}
      {results !== null && (
        <section className="max-w-2xl mx-auto bg-[#1e1e24] rounded-xl p-4 shadow">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-semibold">لا توجد حجوزات للبيانات المدخلة.</div>
          ) : (
            <div>
              <h2 className="text-lg font-bold mb-3 text-[#43e97b]">نتائج البحث:</h2>
              <div className="divide-y divide-[#23242b]">
{results.map((b, idx) => (
  <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
    <div>
      <span className="font-semibold text-[#90cdf4]">رقم الحجز:</span> <span className="text-white">{b.bookingId}</span><br />
      <span className="font-semibold text-[#90cdf4]">التاريخ:</span> <span className="text-white">{b.date}</span>
    </div>
    <div>
      <span className="font-semibold text-[#90cdf4]">الاسم:</span> <span className="text-white">{b.customerName}</span><br />
      <span className="font-semibold text-[#90cdf4]">الجوال:</span> <span className="text-white">{b.customerPhone}</span>
      {b.nationalId && (
        <>
          <br />
          <span className="font-semibold text-[#90cdf4]">رقم الهوية:</span> <span className="text-white">{b.nationalId}</span>
        </>
      )}
    </div>
    <div>
      <span className="font-semibold text-[#90cdf4]">الحالة:</span>{" "}
      <span className={
        b.status === "confirmed"
          ? "font-bold text-green-400"
          : b.status === "pending"
            ? "font-bold text-yellow-300"
            : "font-bold text-red-400"
      }>
        {b.status === "confirmed"
          ? "مؤكد"
          : b.status === "pending"
            ? "معلق"
            : "ملغي"}
      </span>
    </div>
    <div>
      <span className="font-semibold text-[#90cdf4]">العربون:</span> <span className="text-white">{b.depositAmount} ريال</span><br />
      <span className="font-semibold text-[#90cdf4]">المبلغ الكلي:</span> <span className="text-white">{b.totalAmount ?? "—"}</span>
    </div>
  </div>
))}

              </div>
            </div>
          )}
        </section>
      )}
      <div className="text-center mt-8">
        <Link href="/" className="admin-btn">العودة للصفحة الرئيسية</Link>
      </div>
    </main>
  );
}
