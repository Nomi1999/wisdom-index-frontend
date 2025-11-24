'use client';

import { useEffect, useState, useRef } from 'react';

interface LoadingWrapperProps {
  children: React.ReactNode;
  delay?: number;
}

export default function LoadingWrapper({ children, delay = 0 }: LoadingWrapperProps) {
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsReady(true);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [delay]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9999
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading dashboard...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}