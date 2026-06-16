import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearTokens, getRefreshToken, setTokens } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getRefreshToken();

      if (token) {
        try {
          const res = await fetch('http://https://restaurant-management-backend-28nv.onrender.com/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          const data = await res.json();

          if (data.success) {
            const rememberMe =
              localStorage.getItem('rememberMe') === 'true';

            setTokens(
              data.accessToken,
              data.refreshToken,
              rememberMe
            );

            setUser(
              data.user ||
              JSON.parse(localStorage.getItem('user'))
            );
          } else {
            clearTokens();
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.error('[Auth] Startup restoration failed:', err);
        }
      }

      setLoading(false);
    };

    initializeAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      clearTokens();
      localStorage.removeItem('user');
    };

    window.addEventListener(
      'unauthorized_logout',
      handleLogoutEvent
    );

    return () =>
      window.removeEventListener(
        'unauthorized_logout',
        handleLogoutEvent
      );
  }, []);

  // LOGIN
  const login = async (
    email,
    password,
    rememberMe = false
  ) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        rememberMe,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setTokens(
        data.accessToken,
        data.refreshToken,
        rememberMe
      );

      setUser(data.user);

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        'rememberMe',
        rememberMe.toString()
      );
    }

    return data;
  };

  // GOOGLE LOGIN
  const googleLogin = async (
    idToken,
    rememberMe = false
  ) => {
    const res = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        rememberMe,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setTokens(
        data.accessToken,
        data.refreshToken,
        rememberMe
      );

      setUser(data.user);

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        'rememberMe',
        rememberMe.toString()
      );
    }

    return data;
  };

  // REGISTER (NO OTP)
  const register = async (
    name,
    email,
    password,
    role = 'CUSTOMER'
  ) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    return await res.json();
  };

  // LOGOUT
  const logout = async () => {
    try {
      const token = getRefreshToken();

      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (e) {
      console.warn('Logout API warning:', e.message);
    }

    setUser(null);
    clearTokens();
    localStorage.removeItem('user');
  };

  // FORGOT PASSWORD
  const forgotPassword = async (email) => {
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return await res.json();
  };

  // RESET PASSWORD
  const resetPassword = async (
    email,
    otpCode,
    newPassword
  ) => {
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otpCode,
        newPassword,
      }),
    });

    return await res.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};