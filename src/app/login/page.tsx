'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '@/utils/sessionAuth';
import styles from './login.module.css';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const message = searchParams?.get('message');
    if (message) {
      setError(message);
      const registeredUsername = searchParams?.get('username');
      if (registeredUsername) {
        setUsername(registeredUsername);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      document.body.classList.add('form-active');
      document.body.classList.remove('dashboard-active');

      return () => {
        document.body.classList.remove('form-active');
      };
    }
  }, [isMounted]);

  const validateInput = (name: string, value: string): string => {
    if (!value.trim()) {
      return 'This field is required';
    }

    if (name === 'password' && value.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return '';
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setError('');
    setUsernameError('');
    setPasswordError('');

    const usernameValidation = validateInput('username', username);
    const passwordValidation = validateInput('password', password);

    if (usernameValidation || passwordValidation) {
      setUsernameError(usernameValidation);
      setPasswordError(passwordValidation);
      setError('Please fix the errors below');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);

      if (!success) {
        setError('Login failed. Please check your credentials.');
      } else {
        setIsNavigating(true);
      }
    } catch (loginError) {
      console.error('Login error:', loginError);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shellClassName = [
    styles.loginShell,
    isMounted ? styles.shellReady : '',
    isNavigating ? styles.isNavigating : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.loginPage}>
      <main className={shellClassName} key="login">
        <div className={styles.styledWrapper}>
          <form onSubmit={handleLogin} noValidate className={styles.form}>
            <div className={styles.brandBlock} aria-label="Wisdom Index brand">
              <div className={styles.logoContainer}>
                <img
                  src="/assets/images/wisdom-index-logo.webp"
                  alt="Wisdom Index logo"
                  width={68}
                  height={68}
                />
              </div>
              <div className={styles.brandCopy}>
                <span className={styles.brandText}>Wisdom Index</span>
                <span className={styles.brandTagline}>Financial Advisory Platform</span>
              </div>
            </div>

            <p className={styles.title}>Login</p>
            <p className={styles.message}>
              Securely access your personalized insights and manage your financial goals.
            </p>

            <label className={`${styles.inputField} ${usernameError ? styles.hasError : ''}`}>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                required
                autoComplete="username"
                disabled={isLoading}
                className={styles.input}
                placeholder=" "
              />
              <span>Username</span>
              {usernameError && <small>{usernameError}</small>}
            </label>

            <label className={`${styles.inputField} ${passwordError ? styles.hasError : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className={styles.input}
                placeholder=" "
              />
              <span>Password</span>
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {passwordError && <small>{passwordError}</small>}
            </label>

            <button type="submit" className={styles.submit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className={styles.loader} aria-hidden="true" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {error && (
              <div
                className={`${styles.status} ${
                  error.includes('successful') ? styles.success : ''
                }`}
                role="alert"
              >
                {error}
              </div>
            )}

            <p className={styles.signin}>
              Don't have an account?{' '}
              <Link href="/register" className={styles.link}>
                Register as Client
              </Link>
            </p>

            <div className={styles.adminCallout}>
              <p>Wisdom Index Administrator?</p>
              <Link href="/admin-register" className={styles.adminLink}>
                Register as Admin
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
