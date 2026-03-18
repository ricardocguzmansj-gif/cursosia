import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { api } from "./lib/api";
import "./index.css";
import "./i18n"; // Import i18n config
import { Toaster } from 'react-hot-toast';

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GenerateCourse from "./pages/GenerateCourse";
import Navbar from "./components/Navbar";
import { TenantProvider } from "./components/TenantProvider";

const CourseView = React.lazy(() => import("./pages/CourseView"));
const Certificate = React.lazy(() => import("./pages/Certificate"));
const Catalog = React.lazy(() => import("./pages/Catalog"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const AffiliateDashboard = React.lazy(() => import("./pages/AffiliateDashboard"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel"));
const PaymentResult = React.lazy(() => import("./pages/PaymentResult"));
const JobBoard = React.lazy(() => import("./pages/JobBoard"));

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ session, children }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!session) { setChecking(false); return; }
    api.getUserRole().then(r => { setRole(r); setChecking(false); });
  }, [session]);

  if (!session) return <Navigate to="/login" replace />;
  if (checking) return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes and initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) localStorage.setItem("access_token", session.access_token);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem("access_token", session.access_token);
      } else {
        localStorage.removeItem("access_token");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay" style={{ background: "var(--bg-dark)" }}>
        <div className="loading-spinner"></div>
        <p>Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <TenantProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate"
          element={
            <AdminRoute session={session}>
              <AppLayout>
                <GenerateCourse />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute session={session}>
              <AppLayout>
                <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                  <AdminPanel />
                </React.Suspense>
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute session={session}>
              <AppLayout>
                <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                  <CourseView />
                </React.Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Public routes */}
        <Route
          path="/certificate/:code"
          element={
            <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
              <Certificate />
            </React.Suspense>
          }
        />
        <Route
          path="/catalog"
          element={
            <AppLayout>
              <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                <Catalog />
              </React.Suspense>
            </AppLayout>
          }
        />
        <Route
          path="/jobs"
          element={
            <AppLayout>
              <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                <JobBoard />
              </React.Suspense>
            </AppLayout>
          }
        />
        {/* Analytics & Affiliates (protected) */}
        <Route
          path="/payment/result"
          element={
            <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
              <PaymentResult />
            </React.Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute session={session}>
              <AppLayout>
                <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                  <Analytics />
                </React.Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliates"
          element={
            <ProtectedRoute session={session}>
              <AppLayout>
                <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                  <AffiliateDashboard />
                </React.Suspense>
              </AppLayout>
            </ProtectedRoute>
           }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute session={session}>
              <AppLayout>
                <React.Suspense fallback={<div className="loading-spinner" style={{ margin: "4rem auto" }}></div>}>
                  <Leaderboard />
                </React.Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
    </BrowserRouter>
    </TenantProvider>
  );
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
