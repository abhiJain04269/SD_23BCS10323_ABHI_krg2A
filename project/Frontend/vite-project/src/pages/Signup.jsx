import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { requestOtp, clearError } from '../../utils/Slice/authSlice';

const SignupSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password cannot exceed 128 characters'),
});

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: authLoading, error: authError, isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(SignupSchema),
    mode: 'onBlur',
    shouldFocusError: false,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  // Clear form errors and Redux error on mount
  useEffect(() => {
    dispatch(clearError());
    reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    }, { keepErrors: false });
  }, [dispatch, reset]);

  // Handle error display
  useEffect(() => {
    // console.log('Redux error:', authError);
    if (authError) {
      if (authError === 'Incorrect password') {
        setError('password', { type: 'manual', message: 'Incorrect password' });
      } else if (authError === 'User not found' || authError === 'Email not found') {
        setError('email', { type: 'manual', message: 'Email not found' });
      } else if (authError === 'Email is missing' || authError === 'Password is missing') {
        setError('email', { type: 'manual', message: authError });
      } else if (authError === 'Invalid OTP') {
        // console.log('Ignoring Invalid OTP error on Signup page');
      } else if (authError.toLowerCase().includes('password')) {
        setError('password', { type: 'manual', message: authError }); // Set password errors on password field
      } else {
        setError('email', { type: 'manual', message: authError }); // Fallback to email field
      }
      dispatch(clearError()); // Clear Redux error after handling
    } else {
      clearErrors(['email', 'password']);
    }
  }, [authError, setError, clearErrors, dispatch]);

  useEffect(() => {
    // console.log('Signup component rendered');
    if (isAuthenticated) {
      // console.log('User authenticated, redirecting to /');
      sessionStorage.removeItem('emailForOTP');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = useCallback(async (data) => {
    try {
      // console.log('Sending OTP request for:', data.email);
      const response = await dispatch(requestOtp({
        First_Name: data.firstName,
        Last_Name: data.lastName,
        Email_Id: data.email,
        Password: data.password,
      })).unwrap();
      // console.log('OTP request response:', response);
      sessionStorage.setItem('emailForOTP', data.email);
      toast.success('OTP sent to your email', { position: 'top-center', autoClose: 3000 });
      navigate('/otp', { state: { emailForOTP: data.email }, replace: true });
    } catch (err) {
      console.error('Error in onSubmit:', err);
      toast.error(err, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      // Do not set form error or show toast here; let useEffect handle errors
    }
  }, [dispatch, navigate]);

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            <span className="flex items-center">CodeVibin</span>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          Create an Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          Join CodeVibin to start coding today
        </p>
        <form key="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={authLoading}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-2">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={authLoading}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-2">{errors.lastName.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={authLoading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-2">{errors.email.message}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={authLoading}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={authLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="text-red-500 text-xs mt-2">{errors.password.message}</p>}
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
                Sending OTP...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 font-medium"
          >
            Sign In
          </Link>
        </p>
        <ToastContainer position="top-center" autoClose={3000} limit={1} />
      </div>
    </div>
  );
}

export default Signup;