import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import useAuth from '../hooks/useAuth';
import { clearError } from '../store/slices/authSlice';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { pendingVerificationUserId, isLoading, error, verifyOtp, resendOtp, clearPendingVerification, clear } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect away if there's no pending verification
  useEffect(() => {
    if (!pendingVerificationUserId) {
      navigate('/login', { replace: true });
    }
  }, [pendingVerificationUserId, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    dispatch(clearError());
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pendingVerificationUserId) return;
      const code = otp.join('');
      if (code.length < 6) return;
      const result = await verifyOtp(pendingVerificationUserId, code);
      if ((result as { meta?: { requestStatus?: string } })?.meta?.requestStatus === 'fulfilled') {
        navigate('/dashboard', { replace: true });
      }
    },
    [otp, pendingVerificationUserId, verifyOtp, navigate]
  );

  const handleResend = async () => {
    if (!pendingVerificationUserId || resendCountdown > 0) return;
    clear();
    setResendMessage('');
    const result = await resendOtp(pendingVerificationUserId);
    if ((result as { meta?: { requestStatus?: string } })?.meta?.requestStatus === 'fulfilled') {
      setResendMessage('A new code has been sent to your email.');
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleCancel = () => {
    clearPendingVerification();
    navigate('/login', { replace: true });
  };

  if (!pendingVerificationUserId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-500 mt-2 text-sm">
            We sent a 6-digit verification code to your email address. Enter it below to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${error ? 'border-red-400 bg-red-50' : digit ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Resend success message */}
          {resendMessage && !error && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              {resendMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length < 6}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verifying...
              </span>
            ) : 'Verify Email'}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center text-sm text-gray-500">
          Didn't receive the code?{' '}
          {resendCountdown > 0 ? (
            <span className="text-gray-400">Resend in {resendCountdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>

        {/* Cancel */}
        <div className="mt-3 text-center">
          <button
            onClick={handleCancel}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
