import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { requestOtp, verifyOtpAndRegister } from '../../utils/Slice/authSlice';

const OTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
});

function OTPpage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { loading: authLoading, error: authError, isAuthenticated } = useSelector((state) => state.auth);
  const emailForOTP = location.state?.emailForOTP || sessionStorage.getItem('emailForOTP') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(OTPSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    // console.log('OTPpage rendered', { emailForOTP, isAuthenticated });
    if (!emailForOTP) {
      // console.log('No emailForOTP, redirecting to /signup');
      toast.error('Please enter your email first', { position: 'top-center', autoClose: 3000 });
      navigate('/signup', { replace: true });
    }
  }, [emailForOTP, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      // console.log('User authenticated, redirecting to /');
      sessionStorage.removeItem('emailForOTP');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data, event) => {
    event.preventDefault();
    try {
      // console.log('Verifying OTP for:', emailForOTP, 'with OTP:', data.otp);
      await dispatch(verifyOtpAndRegister({
        Email_Id: emailForOTP,
        otp: data.otp,
      })).unwrap();

      toast.success('Account created successfully!', {
        position: 'top-center',
        autoClose: 2000,
      });
    } catch (err) {
      const message = err?.message || 'Invalid OTP';
      console.error('Error in onSubmit:', message);
      setError('otp', { type: 'manual', message });
      toast.error(message, { position: 'top-center', autoClose: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            <span className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4f46e5" />
                <path d="M2 17L12 22L22 17" stroke="#4f46e5" strokeWidth="2" />
                <path d="M2 12L12 17L22 12" stroke="#4f46e5" strokeWidth="2" />
              </svg>
              LeetCode
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          Verify Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          Enter the OTP sent to your email
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              OTP Code
            </label>
            <input
              id="otp"
              type="text"
              placeholder="123456"
              {...register('otp')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={authLoading}
            />
            {errors.otp && <p className="text-red-500 text-xs mt-2">{errors.otp.message}</p>}
            <button
              type="button"
              onClick={() => {
                // console.log('Resending OTP for:', emailForOTP);
                dispatch(requestOtp({ Email_Id: emailForOTP }));
              }}
              className="text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm mt-2"
              disabled={authLoading}
            >
              Resend OTP
            </button>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className={`w-full p-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              authLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {authLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
          Back to{' '}
          <Link
            to="/signup"
            className="text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 font-medium"
          >
            Sign Up
          </Link>
        </p>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
}

export default OTPpage;