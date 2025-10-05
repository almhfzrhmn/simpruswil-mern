// src/pages/auth/VerifyEmailPage.jsx - Email Verification Page
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  BookOpenIcon, 
  EnvelopeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

const VerifyEmailPage = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'error'
  const [message, setMessage] = useState('');
  
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email = location.state?.email || searchParams.get('email') || '';
  const token = searchParams.get('token');
  const initialMessage = location.state?.message || '';

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleVerification = useCallback(async () => {
    if (!token || !email) {
      setMessage('Token atau email tidak valid');
      setVerificationStatus('error');
      return;
    }

    setIsVerifying(true);
    setMessage('Memverifikasi email Anda...');
    
    try {
      const result = await verifyEmail(token, email);
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage('Email berhasil diverifikasi! Anda akan diarahkan ke dashboard...');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(result.error || 'Verifikasi email gagal');
      }
    } catch {
      setVerificationStatus('error');
      setMessage('Terjadi kesalahan saat verifikasi email');
    } finally {
      setIsVerifying(false);
    }
  }, [token, email, verifyEmail, navigate]);

  useEffect(() => {
    // Auto-verify if token and email are present in URL
    if (token && email && !isVerifying && !verificationStatus) {
      handleVerification();
    }
  }, [token, email, isVerifying, verificationStatus, handleVerification]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Email tidak ditemukan. Silakan daftar ulang.');
      return;
    }

    setIsResending(true);
    
    try {
      const result = await resendVerification(email);
      
      if (result.success) {
        setMessage('Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.');
        setVerificationStatus(null);
      } else {
        setMessage(result.error || 'Gagal mengirim ulang email verifikasi');
      }
    } catch {
      setMessage('Terjadi kesalahan saat mengirim ulang email');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    if (isVerifying) {
      return <LoadingSpinner size="lg" />;
    }
    
    switch (verificationStatus) {
      case 'success':
        return <CheckCircleIcon className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-16 h-16 text-red-500" />;
      default:
        return <EnvelopeIcon className="w-16 h-16 text-primary-500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBackgroundColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center">
            <BookOpenIcon className="h-12 w-12 text-primary-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">PerpusBooking</h1>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Verifikasi Email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Status Icon */}
            <div className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full ${getBackgroundColor()} mb-6`}>
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className={`text-lg font-medium mb-4 ${getStatusColor()}`}>
              {message}
            </div>

            {/* Email Display */}
            {email && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">Email yang akan diverifikasi:</p>
                <p className="text-base font-medium text-gray-900 mt-1">{email}</p>
              </div>
            )}

            {/* Actions based on status */}
            <div className="space-y-4">
              {!token && !verificationStatus && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Silakan cek email Anda dan klik link verifikasi yang telah dikirim.
                  </p>
                  
                  {email && (
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-2" />
                          Kirim Ulang Email
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="space-y-3">
                  {email && (
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Mengirim Ulang...</span>
                        </>
                      ) : (
                        'Kirim Ulang Email Verifikasi'
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Daftar Ulang
                  </button>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="text-center">
                  <button
                    onClick={() => navigate('/app')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Lanjut ke Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Kembali ke halaman login
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Butuh Bantuan?
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Pastikan email verifikasi tidak masuk ke folder spam</p>
            <p>• Link verifikasi berlaku selama 24 jam</p>
            <p>• Jika masih bermasalah, silakan hubungi admin</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Kontak: <span className="text-primary-600">admin@pustaka-aceh.go.id</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;