"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingData {
  bookingId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  depositAmount: number;
  apiKey?: string; // أضفنا هذا
  status: BookingStatus;
  createdAt: Date;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [apiKey, setApiKey] = useState(""); // حقل apiKey الجديد
  const [checking, setChecking] = useState(false);
  

  useEffect(() => {
    const d = params.get("date");
    if (d) setDate(d);
  }, [params]);

  async function checkDateAvailable(date: string) {
    setChecking(true);
    const q = query(
      collection(db, "bookings"),
      where("date", "==", date),
      where("status", "in", ["pending", "confirmed"])
    );
    const snap = await getDocs(q);
    setChecking(false);
    return snap.empty;
  }

  async function checkDuplicateBooking(date: string, nationalId: string, customerPhone: string) {
  const q = query(
    collection(db, "bookings"),
    where("date", "==", date),
    where("status", "in", ["pending", "confirmed"]),
    // نحتاج فلتر ثاني للجوال أو الهوية بعد جلب النتائج لأن Firestore لا يدعم or في نفس where
  );
  const snap = await getDocs(q);
  let found = false;
  snap.forEach(doc => {
    const d = doc.data();
    if (d.nationalId === nationalId || d.customerPhone === customerPhone) {
      found = true;
    }
  });
  return found;
}

  function validate(): true | string {
    if (!date) return "يرجى اختيار تاريخ الحجز";
    if (!customerName || customerName.length < 3) return "يرجى إدخال الاسم الكامل بشكل صحيح";
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(customerName)) return "الاسم يجب أن يحتوي على أحرف فقط";
    if (!customerPhone || !/^05\d{8}$/.test(customerPhone)) return "يرجى إدخال رقم جوال سعودي صحيح (05xxxxxxxx)";
    if (!nationalId || !/^[12]\d{9}$/.test(nationalId)) return "يرجى إدخال رقم هوية سعودي صحيح (10 أرقام يبدأ بـ 1 أو 2)";
    if (!depositAmount || isNaN(Number(depositAmount))) return "يرجى إدخال مبلغ العربون";
    const deposit = Number(depositAmount);
    if (deposit < 50) return "الحد الأدنى للعربون 50 ريال";
    if (deposit > 5000) return "الحد الأقصى للعربون 5000 ريال";
    return true;
  }

async function handleDateChange(value: string) {
  setDate(value);
  if (!value) return;
  setChecking(true);
  // تحقق إذا التاريخ محجوز مباشرة
  const q = query(
    collection(db, "bookings"),
    where("date", "==", value),
    where("status", "in", ["pending", "confirmed"])
  );
  const snap = await getDocs(q);
  setChecking(false);
  if (!snap.empty) {
    toast.error("هذا اليوم محجوز بالفعل، اختر يوم آخر.", { duration: 3500 });
    setDate(""); // امسح التاريخ من الحقل
  }
}


async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const valid = validate();
  if (valid !== true) {
    toast.error(valid as string);
    return;
  }
  // تحقق من التكرار أولاً
  toast.loading("جاري التحقق من الحجوزات السابقة...");
  const isDuplicate = await checkDuplicateBooking(date, nationalId, customerPhone);
  toast.dismiss();
  if (isDuplicate) {
    toast.error("لديك حجز مسبق في نفس اليوم بهذه البيانات. لا يمكن تكرار الحجز.");
    return;
  }
  if (!apiKey) {
    toast("إذا أردت استقبال إشعارات واتساب: نفذ خطوات التفعيل وأدخل مفتاح apiKey", { icon: "ℹ️" });
  }
  toast.loading("جاري التحقق من توفر اليوم...");
  const available = await checkDateAvailable(date);
  toast.dismiss();
  if (!available) {
    toast.error("اليوم غير متاح أو محجوز مسبقًا. يرجى اختيار يوم آخر.");
    return;
  }
  const bookingId = `BK${Date.now()}`;
  const data: Omit<BookingData, "createdAt"> = {
    bookingId,
    date,
    customerName,
    customerPhone,
    nationalId,
    depositAmount: Number(depositAmount),
    apiKey: apiKey.trim(),
    status: "pending"
  };
  await setDoc(doc(db, "bookings", bookingId), {
    ...data,
    createdAt: new Date()
  });
  toast.success(
    `تم إرسال طلب الحجز بنجاح!\nرقم الحجز: ${bookingId}\nسيتم مراجعة طلبك والتواصل معك.`,
    { duration: 5000 }
  );
  setCustomerName(""); setCustomerPhone(""); setNationalId(""); setDepositAmount(""); setApiKey("");
  setTimeout(() => router.push("/"), 2000);
}


  return (
    <main>
      <Toaster position="top-center" />
      <header className="text-center py-8">
        <h1 className="text-2xl font-bold mb-2">📝 نموذج حجز الشالية</h1>
        <p className="text-gray-600">يرجى ملء جميع البيانات بدقة</p>
      </header>

      {/* تعليمات تفعيل CallMeBot */}
      <div className="max-w-lg mx-auto mb-6 bg-[#212e36] text-[#90cdf4] rounded-lg shadow p-4">
        <strong>إشعار واتساب تلقائي عند التأكيد (اختياري)</strong>
        <ul className="mt-2 text-sm text-white list-disc pr-6 space-y-1">
          <li>
            أضف الرقم <b>+34 684 73 40 44</b> في جهات الاتصال لديك.
          </li>
          <li>
            أرسل عبر واتساب: <span className="bg-[#181e22] px-2 py-1 rounded text-[#43e97b] font-mono">I allow callmebot to send me messages</span>
          </li>
          <li>
            انتظر حتى يصلك رسالة فيها <b>apiKey</b> واكتبها بالأسفل.
          </li>
        </ul>
        <div className="mt-2 text-xs text-[#43e97b]">
          إذا لم ترغب باستلام إشعارات، اترك الحقل فارغًا.
        </div>
      </div>

      <form className="booking-container max-w-lg mx-auto" onSubmit={handleSubmit}>
        <div className="form-group mb-6">
          <label htmlFor="date">تاريخ الحجز:</label>
<input
  type="date"
  id="date"
  className="input"
  value={date}
  onChange={e => handleDateChange(e.target.value)}
  required
  min={new Date().toISOString().split("T")[0]}
  disabled={checking}
/>

        </div>
        <div className="form-group mb-6">
          <label htmlFor="customerName">الاسم الكامل:</label>
          <input
            type="text"
            id="customerName"
            className="input"
            value={customerName}
            onChange={e => setCustomerName(e.target.value.replace(/[0-9\!\@\#\$\%\^\&\*\(\)\_\+\=\[\]\{\}\|\\\:\;\"\'\<\>\,\.\?\/]/g, ""))}
            required
          />
        </div>
        <div className="form-group mb-6">
          <label htmlFor="customerPhone">رقم الجوال:</label>
          <input
            type="tel"
            id="customerPhone"
            className="input"
            value={customerPhone}
            maxLength={10}
            onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
          />
        </div>
        <div className="form-group mb-6">
          <label htmlFor="nationalId">رقم الهوية:</label>
          <input
            type="text"
            id="nationalId"
            className="input"
            value={nationalId}
            maxLength={10}
            onChange={e => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
          />
        </div>
        <div className="form-group mb-6">
          <label htmlFor="depositAmount">مبلغ العربون (ريال سعودي):</label>
          <input
            type="number"
            id="depositAmount"
            className="input"
            value={depositAmount}
            min={50}
            max={5000}
            step="0.01"
            onChange={e => setDepositAmount(e.target.value.replace(/[^\d.]/g, ""))}
            required
          />
          {depositAmount && Number(depositAmount) > 0 && (
            <div className="mt-2 bg-green-50 text-green-800 rounded p-2 text-center">
              💰 معاينة العربون: <strong>{Number(depositAmount).toFixed(2)}</strong> ريال
            </div>
          )}
        </div>
        {/* حقل apiKey */}
        <div className="form-group mb-6">
          <label htmlFor="apiKey">مفتاح CallMeBot (اختياري):</label>
          <input
            type="text"
            id="apiKey"
            className="input"
            value={apiKey}
            onChange={e => setApiKey(e.target.value.trim())}
            placeholder="مثال: 123456"
          />
          <small className="text-xs text-gray-400">
            يمكنك ترك الحقل فارغًا إذا لا ترغب باستقبال إشعار واتساب.
          </small>
        </div>
        <button
          type="submit"
          className="booking-btn w-full flex items-center justify-center py-3 mt-2"
          disabled={checking}
        >
          {checking ? "يرجى الانتظار..." : "إرسال طلب الحجز"}
        </button>
      </form>
      <div className="text-center mt-8">
        <Link href="/" className="admin-btn">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
