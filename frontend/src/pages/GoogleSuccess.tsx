import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const GoogleSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken) {
      setToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // user will be fetched automatically by App.tsx
      navigate('/');
    } else {
      navigate('/login?error=google_failed');
    }
  }, [searchParams, setToken, navigate]);

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <h2>Authenticating with Google...</h2>
    </div>
  );
};

export default GoogleSuccess;
