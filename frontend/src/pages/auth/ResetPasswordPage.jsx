// src/pages/auth/ResetPasswordPage.jsx - Reset Password Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import gedungPuswilImage from '../../assets/images/gedung-puswil.jpg'

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (!token || !email) {
      setError('root', { message: 'Link reset password tidak valid atau sudah kedaluwarsa' });
    }
  }, [token, email, setError]);

  const onSubmit = async (data) => {
    if (!token || !email) {
      setError('root', { message: 'Link reset password tidak valid' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, email, data.password);

      if (result.success) {
        navigate('/app', { replace: true });
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

          {/* Left Column - Reset Password Form */}
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600 text-sm">
                  Masukkan password baru Anda
                </p>
              </div>

              {/* Reset Password Form */}
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Password */}
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`peer w-full px-4 pt-6 pb-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder=""
                    
                    {...register('password', {
                      required: 'Password harus diisi',
                      minLength: {
                        value: 6,
                        message: 'Password minimal 6 karakter'
                      }
                    })}
                  />
                  <label htmlFor="password" className="absolute left-4 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-700 pointer-events-none">
                    Password Baru
                  </label>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`peer w-full px-4 pt-6 pb-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder=""
                    
                    {...register('confirmPassword', {
                      required: 'Konfirmasi password harus diisi',
                      validate: (value) =>
                        value === password || 'Password tidak cocok'
                    })}
                  />
                  <label htmlFor="confirmPassword" className="absolute left-4 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-700 pointer-events-none">
                    Konfirmasi Password
                  </label>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
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
                    disabled={isLoading || !token || !email}
                    className="w-full bg-blue-600 hover:bg-transparent hover:text-gray-900 text-white font-semibold py-2 px-3 rounded-3xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Mereset...</span>
                      </>
                    ) : (
                      'Reset Password'
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
                <h3 className="text-2xl font-bold mb-4">Password Baru</h3>
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

export default ResetPasswordPage;