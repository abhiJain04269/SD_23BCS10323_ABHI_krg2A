import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react';
import axiosClient from '../../utils/axiosClient';
// Zod schema for OTP validation
const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

function ForgotPass() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRequestedOtp = useRef(false); // Track OTP request
  const requestId = useRef(Date.now().toString()); // Unique ID for OTP request
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown for resend OTP
  const [email, setEmail] = useState(location.state?.email || ''); // Email from location state
  const [otpStatus, setOtpStatus] = useState(null); // null, 'sent', or 'verified'
  const [loading, setLoading] = useState(false); // Loading state
  const [apiError, setApiError] = useState(null); // Renamed to avoid conflict with setError

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    const sendResetRequest = async () => {
      // console.log('sendResetRequest called', { email, hasRequestedOtp: hasRequestedOtp.current, requestId: requestId.current });

      // Skip if OTP request has already been initiated
      if (hasRequestedOtp.current) {
        // console.log('OTP request skipped: already requested');
        return;
      }

      // Validate email
      if (!email.trim()) {
        console.error('No email provided');
        toast.error('Email address is required', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: true,
        });
        navigate('/login', { replace: true });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Invalid email provided', { email });
        toast.error('Invalid email address', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: true,
        });
        navigate('/login', { replace: true });
        return;
      }

      hasRequestedOtp.current = true;
      setLoading(true);
      setApiError(null);
      // console.log('Sending OTP request', { email, requestId: requestId.current });
      try {
        const response = await axiosClient.post('/user/forgot/request-otp', { Email_Id: email, requestId: requestId.current });
        setOtpStatus('sent');
        setResendCooldown(30); // Set 30-second cooldown for resend
        toast.success('OTP sent to your email', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: true,
        });
      } catch (err) {
        console.error('OTP request failed', { error: err });
        hasRequestedOtp.current = false; // Allow retry on failure
        const errorMessage = err.response?.data?.message || 'Failed to send OTP';
        setApiError(errorMessage);
        setOtpStatus('failed');
        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: true,
        });
      } finally {
        setLoading(false);
      }
    };

    // Only send OTP if email is valid and hasn't been sent yet
    if (email && !hasRequestedOtp.current) {
      sendResetRequest();
    }

    // Cooldown timer for resend OTP
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      // console.log('useEffect cleanup triggered');
      clearInterval(timer);
    };
  }, [email, navigate]);

  useEffect(() => {
    // console.log('State update effect', { apiError, otpStatus, email });

    if (apiError && otpStatus === 'failed') {
      toast.error(apiError, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      navigate('/login', { replace: true });
    } else if (otpStatus === 'verified') {
      toast.success('OTP verified successfully', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      navigate('/reset-password', { state: { email }, replace: true });
    }
  }, [apiError, otpStatus, email, navigate]);

  const onSubmit = async (data) => {
    // console.log('Submitting OTP', { otp: data.otp });
    setLoading(true);
    setApiError(null);
    try {
      await axiosClient.post('/user/forgot/verify-otp', {
        Email_Id: email,
        OTP: data.otp,
      });
      setOtpStatus('verified');
    } catch (err) {
      console.error('OTP verification failed', { error: err });
      const errorMessage = err.response?.data?.message === 'Invalid OTP' ? 'Invalid or expired OTP' : 'Failed to verify OTP';
      setError('otp', { type: 'manual', message: errorMessage }); // Set form error for OTP field
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      toast.info(`Please wait ${resendCooldown} seconds before resending OTP`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }
    hasRequestedOtp.current = false; // Allow new OTP request
    requestId.current = Date.now().toString(); // Generate new request ID
    setOtpStatus(null); // Reset OTP status
    setApiError(null);
    setLoading(true);
    console.log('Resending OTP', { email, requestId: requestId.current });
    try {
      await axiosClient.post('/user/forgot/request-otp', { Email_Id: email, requestId: requestId.current });
      setOtpStatus('sent');
      setResendCooldown(30); // Reset cooldown
      toast.success('OTP resent to your email', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
    } catch (err) {
      console.error('OTP resend failed', { error: err });
      hasRequestedOtp.current = false; // Allow retry on failure
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
      setApiError(errorMessage);
      setOtpStatus('failed');
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl w-full max-w-md p-8 space-y-6">
        {/* CodeVibin Logo */}
        <div className="flex justify-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            <span className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4f46e5" />
                <path d="M2 17L12 22L22 17" stroke="#4f46e5" strokeWidth="2" />
                <path d="M2 12L12 17L22 12" stroke="#4f46e5" strokeWidth="2" />
              </svg>
              CodeVibin
            </span>
          </div>
        </div>

        {loading ? (
          <>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              Password Reset
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Sending OTP to {email || 'your email'}... Please wait.
            </p>
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
          </>
        ) : otpStatus === 'sent' ? (
          <>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              Enter OTP
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              An OTP was sent to {email}.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  aria-describedby={errors.otp ? 'otp-error' : undefined}
                  {...register('otp')}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-300"
                />
                {errors.otp && (
                  <p id="otp-error" className="text-red-500 dark:text-red-400 text-xs mt-2 animate-fade-in">
                    {errors.otp.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-indigo-600 text-white rounded-lg font-semibold text-base hover:bg-indigo-500 dark:hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendOtp}
                className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-base hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              Password Reset
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Failed to send OTP. Redirecting to login...
            </p>
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
          </>
        )}

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
          Back to{' '}
          <a
            href="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            Sign In
          </a>
        </p>

        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
          theme="colored"
          className="text-sm font-medium"
          aria-live="polite"
        />
      </div>
    </div>
  );
}

export default ForgotPass;