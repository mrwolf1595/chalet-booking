"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { toast } from "react-hot-toast";
import Link from "next/link";
import AdminCalendar from "./AdminCalendar";
import html2canvas from "html2canvas";

interface Booking {
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

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const bookingRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const arr: Booking[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      arr.push({
        docId: docSnap.id,
        bookingId: d.bookingId,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        nationalId: d.nationalId,
        date: d.date,
        depositAmount: d.depositAmount,
        totalAmount: d.totalAmount,
        apiKey: d.apiKey,
        status: d.status,
      });
    });
    setBookings(arr);
    setLoading(false);
  }

  async function sendWhatsAppNotification(phone: string, apiKey: string, bookingId: string) {
    const fullPhone = phone.startsWith("05") ? "966" + phone.slice(1) : phone;
    const message = `🎉 تم تأكيد حجزك لدى شالية 5 نجوم\nرقم الحجز: ${bookingId}\nشكراً لاختيارك لنا!`;
    
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, message, apiKey }),
      });
      
      console.log("WhatsApp API Response Status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("WhatsApp API Response Data:", data);
        
        if (data.success || data.ok || res.status === 200) {
          toast.success("تم إرسال إشعار واتساب للعميل بنجاح ✅📱", {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#1e293b',
              borderRadius: '12px'
            }
          });
        } else {
          toast.success("تم إرسال إشعار واتساب للعميل 📱", {
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#1e293b',
              borderRadius: '12px'
            }
          });
        }
      } else {
        console.error("WhatsApp API Error Status:", res.status);
        const errorData = await res.json().catch(() => ({}));
        console.error("WhatsApp API Error Data:", errorData);
        
        toast.error("تعذر إرسال رسالة واتساب. تحقق من مفتاح apiKey أو التفعيل 🔧", {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            color: '#fff',
            borderRadius: '12px'
          }
        });
      }
    } catch (error) {
      console.error("WhatsApp API Network Error:", error);
      toast.error("تعذر الاتصال بخدمة واتساب. تحقق من الاتصال بالإنترنت 🌐", {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px'
        }
      });
    }
  }

  async function updateStatus(docId: string, newStatus: "confirmed" | "cancelled", totalAmount?: number) {
    const booking = bookings.find(b => b.docId === docId);

    if (newStatus === "confirmed") {
      if (!booking?.totalAmount || booking.totalAmount < booking.depositAmount) {
        toast.error("يرجى إدخال المبلغ الكلي أولًا (أكبر أو يساوي العربون) 💰");
        return;
      }
    }

    await updateDoc(doc(db, "bookings", docId), {
      status: newStatus,
      ...(totalAmount && { totalAmount }),
    });
    
    const successMessage = newStatus === "confirmed" ? "تم التأكيد بنجاح ✅" : "تم الإلغاء ❌";
    toast.success(successMessage);

    if (
      newStatus === "confirmed" &&
      booking &&
      booking.apiKey &&
      booking.customerPhone
    ) {
      sendWhatsAppNotification(booking.customerPhone, booking.apiKey, booking.bookingId);
    }
    fetchBookings();
  }

  async function downloadBookingAsPNG(docId: string) {
    const node = bookingRefs.current[docId];
    if (!node) return;
    
    toast.loading("جاري إنشاء الصورة... 📸");
    
    try {
      const canvas = await html2canvas(node, { 
        scale: 2,
        backgroundColor: '#23242b',
        useCORS: true 
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

  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === "confirmed").length;

  return (
    <div className="admin-container" style={{ 
      maxWidth: '1400px', 
      margin: '0 auto',
      padding: '1rem'
    }}>
      <AdminCalendar />

      {/* إحصائيات محسنة للموبايل */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="tab-card active" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '1.5rem',
          borderRadius: '16px',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h3 style={{ fontSize: '0.9rem', margin: 0 }}>جميع الحجوزات</h3>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '800' }}>{total}</span>
        </div>
        
        <div className="tab-card" style={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <h3 style={{ fontSize: '0.9rem', margin: 0 }}>المحجوزة</h3>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '800' }}>{confirmed}</span>
        </div>
      </div>
      
      {/* أزرار التحكم محسنة للموبايل */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={fetchBookings} 
            className="admin-btn"
            style={{ 
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: '1',
              minWidth: '120px',
              justifyContent: 'center'
            }}
          >
            <span>🔄</span>
            تحديث البيانات
          </button>
          
          <Link 
            href="/" 
            className="booking-btn"
            style={{ 
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              flex: '1',
              minWidth: '120px',
              justifyContent: 'center'
            }}
          >
            <span>🏠</span>
            العودة للرئيسية
          </Link>
        </div>
        
        <button 
          onClick={onLogout} 
          className="logout-btn"
          style={{ 
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <span>🚪</span>
          تسجيل خروج
        </button>
      </div>

      {/* جدول الحجوزات محسن للموبايل */}
      <div className="bookings-table">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📋</span>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>جميع الحجوزات</h2>
        </div>
        
        {loading ? (
          <div className="text-center my-8" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="loading-spinner"></div>
            <span>جاري التحميل...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center my-8" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '3rem'
          }}>
            <span style={{ fontSize: '4rem' }}>📋</span>
            <span style={{ fontSize: '1.1rem', color: '#64748b' }}>لا توجد حجوزات</span>
          </div>
        ) : (
          bookings.map((b) => (
            <div key={b.docId} className="booking-item" style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* التفاصيل محسنة للموبايل */}
              <div
                className="booking-info"
                ref={el => { bookingRefs.current[b.docId] = el; }}
                dir="rtl"
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  borderRadius: 12,
                  padding: '1rem',
                  fontFamily: "inherit",
                  fontSize: 14,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* شريط الحالة */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: b.status === "confirmed" 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : b.status === "pending"
                    ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                    : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                }}></div>

                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>🔢</span>
                    <span style={{ fontWeight: 700 }}>رقم الحجز:</span> 
                    <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.9rem' }}>{b.bookingId}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>👤</span>
                    <span style={{ fontWeight: 700 }}>العميل:</span> 
                    <span style={{ color: "#4ade80", fontWeight: '700' }}>{b.customerName}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>📱</span>
                    <span style={{ fontWeight: 700 }}>الجوال:</span> 
                    <span style={{ color: "#60a5fa", fontFamily: 'monospace', fontSize: '0.9rem' }}>{b.customerPhone}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>🆔</span>
                    <span style={{ fontWeight: 700 }}>رقم الهوية:</span> 
                    <span style={{ color: "#60a5fa", fontFamily: 'monospace', fontSize: '0.9rem' }}>{b.nationalId}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>📅</span>
                    <span style={{ fontWeight: 700 }}>التاريخ:</span> 
                    <span style={{ color: '#f8fafc' }}>{b.date}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>💰</span>
                    <span style={{ fontWeight: 700 }}>العربون:</span> 
                    <span style={{ color: "#facc15", fontWeight: '700' }}>{b.depositAmount} ريال</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>💵</span>
                    <span style={{ fontWeight: 700 }}>المبلغ الكلي:</span> 
                    <span style={{ color: "#eab308", fontWeight: '700' }}>
                      {b.totalAmount ? `${b.totalAmount} ريال` : "—"}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>💳</span>
                    <span style={{ fontWeight: 700 }}>المبلغ المتبقي:</span> 
                    <span style={{ color: "#f87171", fontWeight: '700' }}>
                      {(b.totalAmount && b.depositAmount) ? `${b.totalAmount - b.depositAmount} ريال` : "—"}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>
                      {b.status === "confirmed" ? "🔒" : b.status === "pending" ? "⏳" : "❌"}
                    </span>
                    <span style={{ fontWeight: 700 }}>الحالة:</span>
                    <span style={{
                      color: b.status === "confirmed"
                        ? "#ef4444"
                        : b.status === "pending"
                        ? "#f59e0b"
                        : "#f87171",
                      fontWeight: 700,
                    }}>
                      {b.status === "confirmed"
                        ? "محجوز"
                        : b.status === "pending"
                        ? "في الانتظار"
                        : "ملغي"}
                    </span>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم محسنة للموبايل */}
              <div className="booking-actions" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem',
                width: '100%'
              }}>
                {b.status === "pending" && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1rem',
                        zIndex: 1
                      }}>💰</span>
                      <input
                        type="number"
                        className="input"
                        placeholder="إجمالي المبلغ"
                        value={b.totalAmount ?? ""}
                        min={b.depositAmount}
                        style={{
                          paddingLeft: '40px',
                          fontSize: '0.9rem',
                          minHeight: '44px',
                          width: '100%',
                          borderRadius: '8px'
                        }}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setBookings(prev =>
                            prev.map(x => x.docId === b.docId ? { ...x, totalAmount: val } : x)
                          );
                        }}
                      />
                    </div>
                    <button 
                      className="confirm-btn" 
                      onClick={() => updateStatus(b.docId, "confirmed", b.totalAmount)}
                      style={{
                        minHeight: '44px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        borderRadius: '8px'
                      }}
                    >
                      <span>✅</span>
                      تأكيد الحجز
                    </button>
                  </>
                )}
                
                {(b.status === "pending" || b.status === "confirmed") && (
                  <button 
                    className="cancel-btn" 
                    onClick={() => updateStatus(b.docId, "cancelled")}
                    style={{
                      minHeight: '44px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      borderRadius: '8px'
                    }}
                  >
                    <span>❌</span>
                    إلغاء الحجز
                  </button>
                )}
                
                {b.status === "confirmed" && (
                  <button
                    className="admin-btn"
                    onClick={() => downloadBookingAsPNG(b.docId)}
                    style={{
                      minHeight: '44px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      borderRadius: '8px'
                    }}
                  >
                    <span>📸</span>
                    تحميل صورة
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}