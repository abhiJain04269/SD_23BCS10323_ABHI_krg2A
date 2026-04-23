import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser, clearError } from '../../utils/Slice/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, Loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const signupSchema = z.object({
    emailId: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { emailId: '', password: '' },
  });

  const emailInput = watch('emailId', '');

  // Clear Redux error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle authentication redirects
  useEffect(() => {
    if (isAuthenticated && user?.Role === 'user') {
      toast.success('Logged in successfully!', {
        position: 'top-center',
        autoClose: 2000,
      });
      navigate('/');
    } else if (isAuthenticated && user?.Role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  // Handle error display
  useEffect(() => {
    // console.log('Redux error:', error);
    if (error) {
      if (error === 'Incorrect password') {
        setError('password', { type: 'manual', message: 'Incorrect password' });
      } else if (error === 'User not found' || error === 'Email not found') {
        setError('emailId', { type: 'manual', message: 'Email not found' });
      } else if (error === 'Email is missing' || error === 'Password is missing') {
        setError('emailId', { type: 'manual', message: error });
      } else if (error === 'Invalid OTP') {
        console.log('Ignoring Invalid OTP error on Login page');
      } else {
        toast.error(error || 'Failed to login', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    } else {
      clearErrors(['emailId', 'password']);
    }
  }, [error, setError, clearErrors]);

  const onSubmit = (data) => {
    const payload = {
      Email_Id: data.emailId.trim(),
      Password: data.password.trim(),
    };
    // console.log('Login payload:', payload);
    dispatch(loginUser(payload));
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPassword = () => {
    // console.log('Forgot password clicked');
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail) {
      setError('emailId', { type: 'manual', message: 'Email is required' });
      toast.error('Please enter your email address', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      return false;
    }

    try {
      signupSchema.shape.emailId.parse(trimmedEmail);
      // console.log('Navigating to forgot-password with email:', trimmedEmail);
      navigate('/forgot-password', { state: { email: trimmedEmail } });
      return true;
    } catch (e) {
      setError('emailId', { type: 'manual', message: 'Invalid email address' });
      toast.error('Please enter a valid email address', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            <span className="flex items-center">CodeVibin</span>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          Sign In
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          Access your account to continue coding
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="emailId"
              type="email"
              placeholder="you@example.com"
              {...register('emailId')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-300"
            />
            {errors.emailId && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 animate-fade-in">
                {errors.emailId.message}
              </p>
            )}
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
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-300"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 animate-fade-in">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            disabled={Loading}
            className={`w-full p-3 bg-indigo-600 text-white rounded-lg font-semibold text-base hover:bg-indigo-500 dark:hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center ${
              Loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {Loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
          New to CodeVibin?{' '}
          <Link
            to="/signup"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            Create an Account
          </Link>
        </p>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
          limit={1} // Prevent stacking toasts
          className="text-sm"
        />
      </div>
    </div>
  );
}

export default Login;