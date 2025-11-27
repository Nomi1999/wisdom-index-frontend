'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import styles from '../register/register.module.css';
import { buildApiUrl } from '@/lib/api';

type AdminRegisterFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  securityCode: string;
};

const initialFormState: AdminRegisterFields = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  securityCode: '',
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AdminRegisterFields>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AdminRegisterFields, string>>
  >({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityCode, setShowSecurityCode] = useState(false);
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

  const validateField = (name: keyof AdminRegisterFields, value: string): string => {
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

    if (name === 'confirmPassword' && value !== formData.password) {
      return 'Passwords do not match';
    }

    return '';
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof AdminRegisterFields, string>> = {};

    (Object.entries(formData) as [keyof AdminRegisterFields, string][]).forEach(
      ([field, value]) => {
        const validationMessage = validateField(field, value);
        if (validationMessage) {
          errors[field] = validationMessage;
        }
      }
    );

    setFieldErrors(errors);
    return errors;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof AdminRegisterFields;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      if (errors.confirmPassword) {
        setMessage('Warning: Passwords do not match');
      } else if (errors.password && errors.password.includes('least 8')) {
        setMessage('Warning: Password must be at least 8 characters long');
      } else if (errors.email) {
        setMessage('Warning: Please enter a valid email address');
      } else {
        setMessage('Warning: Please fix the errors highlighted below');
      }
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/admin/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          security_code: formData.securityCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Admin registration successful:', data);
        setMessage('Success: Admin registration successful! Redirecting to dashboard...');
        setMessageType('success');

        if (typeof window !== 'undefined') {
          // Use session-based authentication
          import('@/utils/sessionAuth').then(({ setToken }) => {
            setToken(data.access_token, data.user);
            console.log('Stored user data:', data.user);
            console.log('User isAdmin:', data.user.isAdmin);
          });
        }

        setTimeout(() => {
          console.log('Redirecting to /admin...');
          router.push('/admin');
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(`Warning: ${error.error}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error during admin registration:', error);
      setMessage('Warning: Registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shellClassName = [
    styles.registerShell,
    isMounted ? styles.shellReady : '',
    isSubmitting ? styles.isBusy : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.registerPage}>
      <main className={shellClassName} key="admin-register">
        <section className={styles.card} aria-label="Admin registration form">
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
                <p className={styles.brandTitle}>Wisdom Index Admin</p>
                <p className={styles.brandTagline}>Secure Control Console</p>
              </div>
              <p className={styles.brandMessage}>
                Create an administrator profile to manage client analytics, advisory workflows,
                and compliance responses from a single dashboard.
              </p>
              <div className={styles.securityBadge}>
                <div className={styles.securityIcon}>🔒</div>
                <div className={styles.securityText}>
                  <strong>Authorized Access Only</strong>
                  <span>Requires valid security code</span>
                </div>
              </div>
              <div className={styles.adminFeatures}>
                <div className={styles.adminFeatureItem}>
                  <div className={styles.adminFeatureIcon}>⚙️</div>
                  <span>System Administration</span>
                </div>
                <div className={styles.adminFeatureItem}>
                  <div className={styles.adminFeatureIcon}>👥</div>
                  <span>Client Management</span>
                </div>
                <div className={styles.adminFeatureItem}>
                  <div className={styles.adminFeatureIcon}>📈</div>
                  <span>Analytics Control</span>
                </div>
                <div className={styles.adminFeatureItem}>
                  <div className={styles.adminFeatureIcon}>🛡️</div>
                  <span>Security Oversight</span>
                </div>
              </div>
            </div>
          </div>

          <form className={styles.formPanel} onSubmit={handleSubmit} noValidate>
            <div className={styles.formHeader}>
              <p className={styles.title}>Admin Registration</p>
              <p className={styles.subtitle}>
                Complete the secure form below to activate administrative access to the Wisdom
                Index platform.
              </p>
            </div>

            <div className={styles.inputGrid}>
              <label
                className={`${styles.inputField} ${
                  fieldErrors.firstName ? styles.hasError : ''
                }`}
              >
                <input
                  type="text"
                  id="first-name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  autoComplete="given-name"
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.firstName)}
                />
                <span>First Name</span>
                {fieldErrors.firstName && <small>{fieldErrors.firstName}</small>}
              </label>

              <label
                className={`${styles.inputField} ${
                  fieldErrors.lastName ? styles.hasError : ''
                }`}
              >
                <input
                  type="text"
                  id="last-name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  autoComplete="family-name"
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.lastName)}
                />
                <span>Last Name</span>
                {fieldErrors.lastName && <small>{fieldErrors.lastName}</small>}
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
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                <span>Email</span>
                {fieldErrors.email && <small>{fieldErrors.email}</small>}
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
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.password)}
                  minLength={8}
                />
                <span>Password</span>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
{fieldErrors.password && <small>{fieldErrors.password}</small>}
              </label>

              <label
                className={`${styles.inputField} ${styles.passwordField} ${
                  fieldErrors.confirmPassword ? styles.hasError : ''
                }`}
              >
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  minLength={8}
                />
                <span>Confirm Password</span>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {fieldErrors.confirmPassword && <small>{fieldErrors.confirmPassword}</small>}
</label>

              <div className={styles.passwordHint}>
                <span>💡 Password must be at least 8 characters long</span>
              </div>

              <label
                className={`${styles.inputField} ${styles.passwordField} ${styles.securityCodeField} ${
                  fieldErrors.securityCode ? styles.hasError : ''
                }`}
              >
                <input
                  type={showSecurityCode ? 'text' : 'password'}
                  id="security-code"
                  name="securityCode"
                  value={formData.securityCode}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                  disabled={isSubmitting}
                  placeholder=" "
                  aria-invalid={Boolean(fieldErrors.securityCode)}
                />
                <span>Security Code</span>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowSecurityCode((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={showSecurityCode ? 'Hide security code' : 'Show security code'}
                >
                  {showSecurityCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {fieldErrors.securityCode && <small>{fieldErrors.securityCode}</small>}
              </label>
            </div>


            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={styles.loader} aria-hidden="true" />
                  Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>

            {message && (
              <div
                className={`${styles.status} ${messageType === 'success' ? styles.success : ''}`}
                role={messageType === 'success' ? 'status' : 'alert'}
              >
                {message}
              </div>
            )}

            <p className={styles.switchForm}>
              Already have an admin account?{' '}
              <Link href="/login" className={styles.link}>
                Sign in
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
