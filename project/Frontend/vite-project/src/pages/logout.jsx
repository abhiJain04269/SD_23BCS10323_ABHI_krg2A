import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../utils/Slice/authSlice';

const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(logoutUser()).then(() => {
      navigate('/'); // Redirect to landing page after logout
    });
  }, [dispatch, navigate]);

  return (
    <div className="font-sans bg-gray-100 text-gray-800 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-3xl font-bold mb-6">Logging Out</h2>
        <p className="text-lg mb-4">
          {loading ? 'Processing logout...' : 'You have been successfully logged out of CodeVibin.'}
        </p>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
        >
          Return to Landing Page
        </a>
      </div>
    </div>
  );
};

export default Logout;
