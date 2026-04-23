import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearForgotPasswordState } from "../../utils/Slice/authSlice"; // Adjust path

// Zod schema for password reset validation
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function ResetPass() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, resetPasswordStatus, forgotPasswordEmail } = useSelector((state) => state.auth);
  const email = location.state?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    hugelybot
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!email.trim()) {
      toast.error('Email address is required', { position: 'top-center', autoClose: 3000, hideProgressBar: true });
      setTimeout(() => navigate('/login'), 3000);
    }
    return () => {
      dispatch(clearForgotPasswordState());
    };
  }, [email, navigate, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-center', autoClose: 3000, hideProgressBar: true });
    } else if (resetPasswordStatus === 'success') {
      toast.success('Password reset successfully', { position: 'top-center', autoClose: 3000, hideProgressBar: true });
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [error, resetPasswordStatus, navigate]);

  const onSubmit = async (data) => {
   
    dispatch(resetPassword({ Email_Id: email, password: data.password, confirmPassword: data.confirmPassword }))
      .unwrap()
      .catch((err) => {
        setError('password', { type: 'manual', message: err });
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            <span className="flex items-center">
              CodeVibin
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          Reset Password
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          Enter a new password for {email || 'your account'}.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...register('password')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-300"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 animate-fade-in">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-300"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 animate-fade-in">
                {errors.confirmPassword.message}
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

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
          className="text-sm"
        />
      </div>
    </div>
  );
}

export default ResetPass;