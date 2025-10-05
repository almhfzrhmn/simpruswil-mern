import React, { useReducer, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';
// import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const useAuth =() => useContext(AuthContext);
// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAIL: 'AUTH_FAIL',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case AUTH_ACTIONS.AUTH_SUCCESS: {
      const { user, token } = action.payload;
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      
      return {
        ...state,
        user,
        token: token || state.token,
        loading: false,
        error: null
      };
    }

    case AUTH_ACTIONS.AUTH_FAIL: {
      // Don't clear token on auth failure unless it's a login/register attempt
      const shouldClearToken = action.clearToken;
      if (shouldClearToken) {
        localStorage.removeItem('token');
      }
      
      return {
        ...state,
        user: shouldClearToken ? null : state.user,
        token: shouldClearToken ? null : state.token,
        loading: false,
        error: action.payload
      };
    }

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};


// Import AuthContext from separate file
// import { AuthContext } from './AuthContext';

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await authAPI.getMe();
        dispatch({ 
          type: AUTH_ACTIONS.AUTH_SUCCESS, 
          payload: { user: response.data.user, token } 
        });
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        dispatch({ 
          type: AUTH_ACTIONS.AUTH_FAIL, 
          payload: 'Session expired',
          clearToken: true 
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.login(credentials);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.data 
      });
      
      toast.success('Login berhasil!');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal';
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_FAIL, 
        payload: message,
        clearToken: true 
      });
      
      toast.error(message);
      return { success: false, error: message, needsVerification: error.response?.data?.needsVerification };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.register(userData);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: { user: response.data.user, token: null } 
      });
      
      toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Registrasi gagal';
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_FAIL, 
        payload: message,
        clearToken: true 
      });
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Verify email function
  const verifyEmail = async (token, email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.verifyEmail({ token, email });
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.data 
      });
      
      toast.success('Email berhasil diverifikasi!');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Verifikasi email gagal';
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_FAIL, 
        payload: message,
        clearToken: false 
      });
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      await authAPI.resendVerification({ email });
      toast.success('Email verifikasi telah dikirim ulang!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengirim email verifikasi';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success('Link reset password telah dikirim ke email Anda!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengirim email reset password';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Reset password function
  const resetPassword = async (token, email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.resetPassword({ token, email, password });
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.data 
      });
      
      toast.success('Password berhasil direset!');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Reset password gagal';
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_FAIL, 
        payload: message,
        clearToken: false 
      });
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.data 
      });
      
      toast.success('Password berhasil diubah!');
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengubah password';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      dispatch({ 
        type: AUTH_ACTIONS.UPDATE_USER, 
        payload: response.data.user 
      });
      
      toast.success('Profile berhasil diupdate!');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengupdate profile';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logout berhasil!');
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(state.token && state.user && state.user.isVerified);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is verified
  const isVerified = () => {
    return state.user?.isVerified === true;
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    logout,
    clearError,
    
    // Helper functions
    isAuthenticated,
    hasRole,
    isAdmin,
    isVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// export default AuthContext;
// export const useAuth = () => useContext(AuthContext);