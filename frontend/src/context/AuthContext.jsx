import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Initialize and check token
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Failed to load user session:', err);
          logout();
        }
      }
      setLoading(false);
    }

    const handleSessionExpired = () => {
      setToken('');
      setUser(null);
    };

    window.addEventListener('qoutpro:session-expired', handleSessionExpired);
    loadUser();

    return () => window.removeEventListener('qoutpro:session-expired', handleSessionExpired);
  }, []);

  // Step 1: Initiate Login (Validates password -> Dispatches 2FA OTP)
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    return res.data;
  };

  // Step 2: Complete Login via 2FA OTP
  const verifyLoginOTP = async (email, otp) => {
    const res = await authAPI.verifyLoginOTP({ email, otp });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error('Invalid OTP verification response');
  };

  // Step 1: Initiate Registration (Validates & Dispatches Signup OTP)
  const register = async (userData) => {
    const res = await authAPI.register(userData);
    return res.data;
  };

  // Step 2: Complete Registration via Signup OTP
  const verifySignupOTP = async (email, otp) => {
    const res = await authAPI.verifySignupOTP({ email, otp });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error('Invalid signup verification response');
  };

  // Resend OTP with cooldown
  const resendOTP = async (email) => {
    const res = await authAPI.resendOTP({ email });
    return res.data;
  };

  // Step 1: Demo Login (Instant Access to isolated demo tenant)
  const demoLogin = async () => {
    const res = await authAPI.demoLogin();
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error('Invalid demo login response');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await authAPI.updateProfile(profileData);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const changePassword = async (passwordData) => {
    const res = await authAPI.changePassword(passwordData);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        verifyLoginOTP,
        register,
        verifySignupOTP,
        resendOTP,
        demoLogin,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
