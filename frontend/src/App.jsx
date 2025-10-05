// src/App.jsx - Main React Application
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Import Swiper Card Styling
import './styles/swiper-custom.css';

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";

// Lazy load all components for code splitting
// Public Pages
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

// User Pages
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const RoomsPage = lazy(() => import("./pages/user/RoomsPage"));
const MyBookingsPage = lazy(() => import("./pages/user/MyBookingsPage"));
const ToursPage = lazy(() => import("./pages/user/ToursPage"));
const MyToursPage = lazy(() => import("./pages/user/MyToursPage"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRooms = lazy(() => import("./pages/admin/AdminRooms"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminTours = lazy(() => import("./pages/admin/AdminTours"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage"));

// Layout Components
const Layout = lazy(() => import("./components/layout/Layout"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const LoadingSpinner = lazy(() => import("./components/ui/LoadingSpinner"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const PublicRoute = lazy(() => import("./components/auth/PublicRoute"));

// Loading component
const AppLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Memuat PerpusBooking...</p>
    </div>
  </div>
);

// Main App Router Component
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* User Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <UserDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Layout>
              <RoomsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <Layout>
              <MyBookingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tours"
        element={
          <ProtectedRoute>
            <Layout>
              <ToursPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tours"
        element={
          <ProtectedRoute>
            <Layout>
              <MyToursPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rooms"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminRooms />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminBookings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tours"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminTours />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminProfilePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirect logic based on user role */}
      <Route
        path="/app"
        element={
          user ? (
            user.role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all route - redirect to appropriate dashboard or landing */}
      <Route
        path="*"
        element={
          user ? (
            user.role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
    </Suspense>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App min-h-screen bg-gray-50">
          <AppRouter />

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // Define default options
              className: "",
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              },
              // Success toast styling
              success: {
                duration: 3000,
                style: {
                  background: "#059669",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#059669",
                },
              },
              // Error toast styling
              error: {
                duration: 5000,
                style: {
                  background: "#DC2626",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#DC2626",
                },
              },
              // Loading toast styling
              loading: {
                style: {
                  background: "#3B82F6",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#3B82F6",
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
