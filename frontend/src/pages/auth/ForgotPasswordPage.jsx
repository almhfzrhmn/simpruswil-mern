// src/pages/auth/ForgotPasswordPage.jsx - Forgot Password Page
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import gedungPuswilImage from '../../assets/images/gedung-puswil.jpg'

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const result = await forgotPassword(data.email);

      if (result.success) {
        // Success message is shown via toast
      } else {
        setError('root', { message: result.error });
      }
    } catch {
      setError('root', { message: 'Terjadi kesalahan yang tidak terduga' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px white inset;
          color: black !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl flex bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">

          {/* Left Column - Forgot Password Form */}
          <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 min-h-[600px]">
            <div className="max-w-md mx-auto">
              {/* Logo and Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">SIMPRUSWIL</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password</h1>
                <p className="text-gray-600 text-sm">
                  Masukkan email Anda dan kami akan mengirim link reset password
                </p>
              </div>

              {/* Forgot Password Form */}
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`peer w-full px-4 pt-6 pb-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder=""
                    
                    {...register('email', {
                      required: 'Email harus diisi',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Format email tidak valid'
                      }
                    })}
                  />
                  <label htmlFor="email" className="absolute left-4 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-700 pointer-events-none">
                    Email
                  </label>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Form Error */}
                {errors.root && (
                  <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                    <p className="text-sm text-red-800">{errors.root.message}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-transparent hover:text-gray-900 text-white font-semibold py-2 px-3 rounded-3xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Mengirim...</span>
                      </>
                    ) : (
                      'Kirim Link Reset'
                    )}
                  </button>
                </div>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Ingat password Anda?{' '}
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Login disini
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-500/20 to-green-400/20 backdrop-blur-sm min-h-[600px]">
            {/* Library Building Image */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={gedungPuswilImage}
                  alt="Modern Library Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 flex items-end justify-center p-12 z-10">
              <div className="text-white text-center max-w-sm">
                <h3 className="text-2xl font-bold mb-4">Reset Password</h3>
                <p className="text-white/90 leading-relaxed">
                  Sistem manajemen perpustakaan modern untuk booking ruangan dan tur perpustakaan yang mudah dan efisien.
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"></div>
            <div className="absolute top-1/3 left-12 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;