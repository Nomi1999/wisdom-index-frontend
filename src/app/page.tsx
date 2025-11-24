'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page immediately when user visits the root
    router.replace('/login');
  }, [router]);

  // Show a minimal loading state while redirecting
  return (
    <div className="container">
      <main className="page">
        <div className="login-card">
          <div className="loading-spinner-large"></div>
          <p>Redirecting to login...</p>
        </div>
      </main>
    </div>
  );
}
