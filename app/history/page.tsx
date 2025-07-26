"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { getFullHijriDate } from "@/lib/hijri";

interface Booking {
  bookingId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  status: "confirmed" | "pending"; // أزلنا "cancelled" لأن الملغية تُحذف
  depositAmount: number;
  totalAmount?: number;
  createdAt?: Timestamp;
}

export default function BookingHistoryPage() {
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);

  // البحث بالهوية الوطنية فقط
  async function searchByNationalId() {
    if (!nationalId.trim()) {
      toast.error("يرجى إدخال رقم الهوية الوطنية 🆔", {
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }
      });
      return;
    }

    if (!/^[12]\d{9}$/.test(nationalId)) {
      toast.error("رقم الهوية غير صحيح. يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2 🚫", {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px'
        }
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      // البحث بالهوية الوطنية فقط - سنجد فقط الحجوزات النشطة (confirmed و pending)
      const q = query(
        collection(db, "bookings"),
        where("nationalId", "==", nationalId.trim())
      );
      
      const snapshot = await getDocs(q);
      const bookings: Booking[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // نستثني الحجوزات الملغية (إن وُجدت) لأنها ستُحذف تدريجياً
        if (data.status !== "cancelled") {
          bookings.push({
            bookingId: data.bookingId,
            date: data.date,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            nationalId: data.nationalId,
            status: data.status,
            depositAmount: data.depositAmount,
            totalAmount: data.totalAmount,
            createdAt: data.createdAt
          });
        }
      });

      // ترتيب النتائج حسب التاريخ الأحدث
      bookings.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        }
        return 0;
      });

      setResults(bookings);

      if (bookings.length === 0) {
        toast("لا توجد حجوزات نشطة بهذا الرقم 📋", {
          icon: "ℹ️",
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#1e293b',
            borderRadius: '12px',
            border: '1px solid rgba(250, 112, 154, 0.3)'
          }
        });
      } else {
        toast.success(`تم العثور على ${bookings.length} حجز نشط 🎉`, {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: '#1e293b',
            borderRadius: '12px'
          }
        });
      }

    } catch (error) {
      console.error("Search error:", error);
      toast.error("حدث خطأ أثناء البحث. حاول مرة أخرى 🔄", {
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px'
        }
      });
    } finally {
      setLoading(false);
    }
  }

  // مسح النتائج والبحث من جديد
  function resetSearch() {
    setNationalId("");
    setResults(null);
    setSearched(false);
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      <Toaster position="top-center" />
      
      {/* Header */}
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
          background: 'linear-gradient(90deg, transparent, rgba(250, 112, 154, 0.8), transparent)'
        }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h1 className="text-2xl font-bold">تتبع حجزي</h1>
          <span style={{ fontSize: '3rem' }}>📋</span>
        </div>
        
        <p style={{ color: '#94a3b8', margin: 0, marginBottom: '0.5rem' }}>
          أدخل رقم الهوية الوطنية لعرض حجوزاتك النشطة
        </p>
        
        {/* ملاحظة مهمة */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '0.75rem',
          marginTop: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>
              الحجوزات الملغية يتم حذفها نهائياً من النظام
            </span>
          </div>
        </div>
      </header>

      {/* نموذج البحث */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🆔</span>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>البحث بالهوية الوطنية</h2>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            color: '#94a3b8',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            رقم الهوية الوطنية:
          </label>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={nationalId}
              onChange={e => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              placeholder="مثال: 1234567890"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                paddingLeft: '3rem',
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 20px rgba(96, 165, 250, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchByNationalId();
                }
              }}
            />
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.2rem'
            }}>
              🆔
            </span>
          </div>
          
          {nationalId && nationalId.length > 0 && nationalId.length < 10 && (
            <div style={{ 
              color: '#f59e0b', 
              fontSize: '0.85rem', 
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>⚠️</span>
              <span>رقم الهوية يجب أن يكون 10 أرقام</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={searchByNationalId}
            disabled={loading || nationalId.length !== 10}
            style={{
              background: loading || nationalId.length !== 10 
                ? 'rgba(102, 126, 234, 0.5)' 
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: loading || nationalId.length !== 10 ? '#94a3b8' : '#1e293b',
              border: 'none',
              borderRadius: '12px',
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading || nationalId.length !== 10 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              opacity: loading || nationalId.length !== 10 ? 0.6 : 1,
              flex: '1',
              justifyContent: 'center',
              minWidth: '200px'
            }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(30, 41, 59, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: '#1e293b',
                  animation: 'spin 1s ease-in-out infinite'
                }}></div>
                <span>جاري البحث...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>البحث عن حجوزاتي النشطة</span>
              </>
            )}
          </button>

          {searched && (
            <button
              onClick={resetSearch}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <span>🔄</span>
              <span>بحث جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* النتائج */}
      {searched && results !== null && (
        <section style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
        }}>
          {results.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '4rem' }}>📋</span>
              <h3 style={{ 
                margin: 0, 
                color: '#64748b',
                fontSize: '1.2rem' 
              }}>
                لا توجد حجوزات نشطة
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#94a3b8',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                لم يتم العثور على أي حجوزات نشطة بهذا الرقم
              </p>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span>
                  <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                    إذا كان لديك حجوزات ملغية، فقد تم حذفها نهائياً من النظام
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1.5rem' 
              }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.3rem',
                  color: '#f8fafc' 
                }}>
                  حجوزاتك النشطة ({results.length})
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {results.map((booking, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '1.5rem',
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
                      background: booking.status === "confirmed" 
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                    }}></div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: '1.5rem',
                      marginTop: '0.5rem'
                    }}>
                      {/* معلومات الحجز */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>🔢</span>
                          <strong style={{ color: '#90cdf4' }}>رقم الحجز:</strong>
                          <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{booking.bookingId}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>📅</span>
                          <strong style={{ color: '#90cdf4' }}>يوم الحجز:</strong>
                          <span style={{ color: '#60a5fa', fontWeight: '700' }}>{(() => {
                            const [y, m, d] = booking.date.split("-").map(Number);
                            const gregorianDate = new Date(y, m - 1, d);
                            return gregorianDate.toLocaleDateString('ar-EG', { weekday: 'long' });
                          })()}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>📅</span>
                          <strong style={{ color: '#90cdf4' }}>التاريخ الميلادي:</strong>
                          <span style={{ color: '#f8fafc' }}>{booking.date}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>🌙</span>
                          <strong style={{ color: '#90cdf4' }}>التاريخ الهجري:</strong>
                          <span style={{ color: '#22c55e' }}>{(() => {
                            const [y, m, d] = booking.date.split("-").map(Number);
                            const gregorianDate = new Date(y, m - 1, d);
                            return getFullHijriDate(gregorianDate);
                          })()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>👤</span>
                          <strong style={{ color: '#90cdf4' }}>الاسم:</strong>
                          <span style={{ color: '#4ade80', fontWeight: '600' }}>{booking.customerName}</span>
                        </div>
                      </div>

                      {/* المعلومات المالية والحالة */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>💰</span>
                          <strong style={{ color: '#90cdf4' }}>العربون:</strong>
                          <span style={{ color: '#facc15', fontWeight: '600' }}>{booking.depositAmount} ريال</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>💵</span>
                          <strong style={{ color: '#90cdf4' }}>المبلغ الكلي:</strong>
                          <span style={{ color: '#eab308', fontWeight: '600' }}>
                            {booking.totalAmount ? `${booking.totalAmount} ريال` : "غير محدد"}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>
                            {booking.status === "confirmed" ? "✅" : "⏳"}
                          </span>
                          <strong style={{ color: '#90cdf4' }}>الحالة:</strong>
                          <span style={{
                            color: booking.status === "confirmed"
                              ? "#4ade80"
                              : "#facc15",
                            fontWeight: '700',
                            fontSize: '0.95rem'
                          }}>
                            {booking.status === "confirmed"
                              ? "مؤكد"
                              : "في الانتظار"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ملاحظة للحجز المؤكد */}
                    {booking.status === "confirmed" && (
                      <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginTop: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>🎉</span>
                          <span style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.9rem' }}>
                            تم تأكيد حجزك! نتطلع لاستقبالك
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ملاحظة للحجز في الانتظار */}
                    {booking.status === "pending" && (
                      <div style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginTop: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>⏳</span>
                          <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.9rem' }}>
                            حجزك في انتظار المراجعة والتأكيد
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* زر العودة */}
      <div className="text-center mt-8">
        <Link 
          href="/" 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            textDecoration: 'none',
            padding: '0.875rem 2rem',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
        >
          <span>🏠</span>
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}