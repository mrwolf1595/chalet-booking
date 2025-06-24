"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور 📧", {
        duration: 3000,
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

    if (!email.includes('@')) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح 📧", {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px'
        }
      });
      return;
    }

    setLoading(true);
    
    try {
      // محاولة تسجيل الدخول باستخدام Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("Login successful for:", user.email);
      
      toast.success("مرحباً بك في لوحة الإدارة! 👋", {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: '#1e293b',
          borderRadius: '12px',
          border: '1px solid rgba(79, 172, 254, 0.3)',
          backdropFilter: 'blur(10px)'
        }
      });
      
      // انتظار قصير للتأكد من تحديث الحالة
      setTimeout(() => {
        onSuccess();
      }, 500);
      
    } catch (error) {
      console.error("Login error:", error);
      
      // رسائل خطأ مخصصة حسب نوع الخطأ
      let errorMessage = "حدث خطأ في تسجيل الدخول";
      
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as AuthError;
        
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = "البريد الإلكتروني غير مسجل في النظام 🚫";
            break;
          case 'auth/wrong-password':
            errorMessage = "كلمة المرور غير صحيحة 🔐";
            break;
          case 'auth/invalid-email':
            errorMessage = "البريد الإلكتروني غير صحيح 📧";
            break;
          case 'auth/too-many-requests':
            errorMessage = "محاولات كثيرة خاطئة. حاول مرة أخرى لاحقاً ⏰";
            break;
          case 'auth/network-request-failed':
            errorMessage = "مشكلة في الاتصال بالإنترنت 🌐";
            break;
          case 'auth/invalid-credential':
            errorMessage = "بيانات الدخول غير صحيحة. تحقق من الإيميل وكلمة المرور 🔒";
            break;
          default:
            errorMessage = "بيانات الدخول غير صحيحة أو هناك مشكلة في الاتصال 🚫";
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }
      });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container max-w-md mx-auto my-8" style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* شريط علوي مضيء */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent)'
      }}></div>

      {/* رأس النموذج */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ 
          fontSize: '3rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔐
        </div>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          تسجيل دخول الإدارة
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#64748b', 
          fontSize: '0.9rem' 
        }}>
          أدخل بيانات المدير للوصول للوحة التحكم
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group mb-6">
          <label htmlFor="adminEmail" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.75rem',
            color: '#94a3b8',
            fontWeight: '600'
          }}>
            <span>📧</span>
            البريد الإلكتروني:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              id="adminEmail"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              required
              autoComplete="username"
              placeholder="admin@example.com"
              style={{
                paddingLeft: '3rem',
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '1rem',
                padding: '0.875rem 1.25rem',
                width: '100%'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '1.1rem'
            }}>
              📧
            </span>
          </div>
        </div>

        <div className="form-group mb-6">
          <label htmlFor="adminPassword" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.75rem',
            color: '#94a3b8',
            fontWeight: '600'
          }}>
            <span>🔑</span>
            كلمة المرور:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              id="adminPassword"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                paddingLeft: '3rem',
                paddingRight: '3rem',
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '1rem',
                padding: '0.875rem 1.25rem',
                width: '100%'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '1.1rem'
            }}>
              🔑
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.25rem'
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="admin-btn w-full flex items-center justify-center py-3"
          disabled={loading}
          style={{
            background: loading 
              ? 'rgba(102, 126, 234, 0.5)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '48px',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transform: loading ? 'none' : 'translateY(0)',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }
          }}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                borderTopColor: '#fff',
                animation: 'spin 1s ease-in-out infinite'
              }}></div>
              <span>جاري التحقق...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>دخول لوحة التحكم</span>
            </>
          )}
        </button>
      </form>

      {/* معلومات إضافية */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(79, 172, 254, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(79, 172, 254, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: '#64748b'
        }}>
          <span>🔒</span>
          <span>صفحة محمية - للمديرين المعتمدين فقط</span>
        </div>
      </div>
    </div>
  );
}