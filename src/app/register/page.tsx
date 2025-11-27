'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import styles from './register.module.css';
import { buildApiUrl } from '@/lib/api';

type RegisterFormFields = {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
};

const initialFormData: RegisterFormFields = {
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormFields>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterFormFields, string>>
  >({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    document.body.classList.add('form-active');
    document.body.classList.remove('dashboard-active');

    return () => {
      document.body.classList.remove('form-active');
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateField = (name: keyof RegisterFormFields, value: string): string => {
    if (!value.trim()) {
      return 'This field is required';
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (name === 'password' && value.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return '';
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof RegisterFormFields, string>> = {};
    (Object.entries(formData) as [keyof RegisterFormFields, string][]).forEach(
      ([field, value]) => {
        const validationMessage = validateField(field, value);
        if (validationMessage) {
          errors[field] = validationMessage;
        }
      }
    );

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof RegisterFormFields;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Please fix the errors highlighted below');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);

        setTimeout(() => {
          router.push(
            `/login?message=${encodeURIComponent(
              'Registration successful! Please login with your credentials.'
            )}&username=${encodeURIComponent(formData.username)}`
          );
        }, 600);
      } else if (response.status === 409) {
        setError(
          data.message ||
            'This information is already registered. Please use different credentials.'
        );
      } else if (response.status === 400) {
        setError(data.message || 'Please check your information and try again.');
      } else {
        setError(data.message || 'Registration failed. Please try again later.');
      }
    } catch (registrationError) {
      console.error('Registration error:', registrationError);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shellClassName = [
    styles.registerShell,
    isMounted ? styles.shellReady : '',
    isLoading ? styles.isBusy : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.registerPage}>
      <main className={shellClassName} key="register">
        <section className={styles.card} aria-label="Client registration form">
          <div className={styles.brandPanel}>
            <div className={styles.brandPanelContent}>
              <div className={styles.logoBadge}>
                <img
                  src="/assets/images/wisdom-index-logo.webp"
                  alt="Wisdom Index logo"
                  width={80}
                  height={80}
                  loading="lazy"
                />
              </div>
<div className={styles.brandCopy}>
                <p className={styles.brandTitle}>Wisdom Index</p>
                <p className={styles.brandTagline}>Financial Advisory Platform</p>
              </div>
              <p className={styles.brandMessage}>
                Register as a client to unlock personalized analytics, advisory insights, and
                proactive goal tracking.
              </p>
              <div className={styles.brandFeatures}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>📊</div>
                  <span>Advanced Analytics</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>🎯</div>
                  <span>Goal Tracking</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>🤝</div>
                  <span>Expert Advisory</span>
                </div>
              </div>
              <div className={styles.brandChart} aria-hidden="true">
                <svg viewBox="0 0 320 150" role="img" aria-label="Portfolio growth line chart">
                  <defs>
                    <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
                      <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="320" height="150" fill="url(#chart-bg)" />
                  <polyline
                    fill="none"
                    stroke="rgba(148,163,184,0.45)"
                    strokeWidth="1"
                    points="0,120 320,120"
                  />
                  <polyline
                    fill="none"
                    stroke="rgba(148,163,184,0.45)"
                    strokeWidth="1"
                    points="0,90 320,90"
                  />
                  <polyline
                    fill="none"
                    stroke="rgba(148,163,184,0.45)"
                    strokeWidth="1"
                    points="0,60 320,60"
                  />
                  <polyline
                    fill="none"
                    stroke="rgba(148,163,184,0.45)"
                    strokeWidth="1"
                    points="0,30 320,30"
                  />
                  <polyline
                    fill="url(#chart-fill)"
                    stroke="none"
                    points="0,130 10,120 30,110 50,125 70,90 90,130 110,80 130,115 150,70 170,125 190,60 210,95 230,50 250,85 270,45 290,95 310,30 320,150"
                  />
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,130 10,120 30,110 50,125 70,90 90,130 110,80 130,115 150,70 170,125 190,60 210,95 230,50 250,85 270,45 290,95 310,30"
                  />
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="310,30 320,15"
                  />
                </svg>
              </div>
            </div>
          </div>

          <form className={styles.formPanel} onSubmit={handleRegister} noValidate>
            <div className={styles.formHeader}>
              <p className={styles.title}>Client Registration</p>
              <p className={styles.subtitle}>
                Complete your profile to verify your identity and activate your dashboard.
              </p>
            </div>

            <div className={styles.inputGrid}>
              <label
                className={`${styles.inputField} ${
                  fieldErrors.first_name ? styles.hasError : ''
                }`}
              >
                <input
                  type="text"
                  id="first-name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  autoComplete="given-name"
                  disabled={isLoading}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.first_name)}
                />
                <span>First Name</span>
                {fieldErrors.first_name && <small>{fieldErrors.first_name}</small>}
              </label>

              <label
                className={`${styles.inputField} ${
                  fieldErrors.last_name ? styles.hasError : ''
                }`}
              >
                <input
                  type="text"
                  id="last-name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  autoComplete="family-name"
                  disabled={isLoading}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.last_name)}
                />
                <span>Last Name</span>
                {fieldErrors.last_name && <small>{fieldErrors.last_name}</small>}
              </label>

              <label
                className={`${styles.inputField} ${
                  fieldErrors.email ? styles.hasError : ''
                }`}
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                <span>Email</span>
                {fieldErrors.email && <small>{fieldErrors.email}</small>}
              </label>

              <label
                className={`${styles.inputField} ${
                  fieldErrors.username ? styles.hasError : ''
                }`}
              >
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.username)}
                />
                <span>Username</span>
                {fieldErrors.username && <small>{fieldErrors.username}</small>}
              </label>

              <label
                className={`${styles.inputField} ${styles.passwordField} ${
                  fieldErrors.password ? styles.hasError : ''
                }`}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.password)}
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
                {fieldErrors.password && <small>{fieldErrors.password}</small>}
              </label>
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={isLoading || isSuccess}
            >
              {isSuccess ? (
                'Success!'
              ) : isLoading ? (
                <>
                  <span className={styles.loader} aria-hidden="true" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>

            {error && (
              <div className={styles.status} role="alert">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className={`${styles.status} ${styles.success}`} role="status">
                Registration complete. Redirecting you to login...
              </div>
            )}

            <p className={styles.switchForm}>
              Already have an account?{' '}
              <Link href="/login" className={styles.link}>
                Login
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
