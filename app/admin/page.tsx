"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import AdminLoginForm from "./AdminLoginForm";
import AdminDashboard from "./AdminDashboard";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { Toaster } from "react-hot-toast";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // استمع لتغيير حالة المصادقة
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      
      if (firebaseUser) {
        // إذا كان المستخدم مسجل دخول في Firebase، يقبل تلقائياً
        console.log("User authenticated:", firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log("No user authenticated");
        setUser(null);
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // شاشة التحميل
  if (authLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ fontSize: '3rem' }}>🔐</div>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '50%',
            borderTopColor: '#667eea',
            animation: 'spin 1s ease-in-out infinite'
          }}></div>
          <div style={{ 
            color: '#94a3b8', 
            fontSize: '1.1rem',
            textAlign: 'center'
          }}>
            جاري التحقق من صلاحية الدخول...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      minHeight: '100vh'
    }}>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#f8fafc'
          }
        }}
      />
      
      {user ? (
        <>
          {/* شريط ترحيب للمدير */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👋</span>
              <div>
                <div style={{ 
                  color: '#f8fafc', 
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  مرحباً بك في لوحة الإدارة
                </div>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: '0.85rem'
                }}>
                  {user.email}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>✅</span>
                متصل
              </div>
            </div>
          </div>
          
          <AdminDashboard
            onLogout={() => {
              signOut(auth);
              setUser(null);
            }}
          />
        </>
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '1rem'
        }}>
          <AdminLoginForm 
            onSuccess={() => {
              // لا نحتاج لعمل شيء هنا
              // onAuthStateChanged سيتولى الأمر
              console.log("Login successful, waiting for auth state change...");
            }} 
          />
        </div>
      )}
    </main>
  );
}