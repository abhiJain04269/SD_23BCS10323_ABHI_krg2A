import { useNavigate, useParams } from 'react-router';
import axiosClient from '../../utils/axiosClient';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Save, ArrowLeft, AlertCircle, X, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../utils/Slice/authSlice';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user_id } = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Age: '',
    Email_Id: '',
    Old_Password: '',
    Password: '',
    Profile_Photo: '',
    Profile_Photo_PublicId: '',
  });
  const [errors, setErrors] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Sync with system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle theme manually
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // console.log('Fetching user data for user_id:', user_id);
        if (!authUser || authUser._id !== user_id) {
          throw new Error('Unauthorized or incorrect user ID');
        }
        const { data } = await axiosClient.get(`/user/find`);
        // console.log('User Data:', data);
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user data:', err.response?.data || err);
        setErrors({ general: err.response?.data?.error || err.message || 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user_id, authUser]);

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        First_Name: user.First_Name || '',
        Last_Name: user.Last_Name || '',
        Age: user.Age || '',
        Email_Id: user.Email_Id || '',
        Old_Password: '',
        Password: '',
        Profile_Photo: user.Profile_Photo || '',
        Profile_Photo_PublicId: user.Profile_Photo_PublicId || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.First_Name || formData.First_Name.length < 2 || formData.First_Name.length > 20) {
      newErrors.First_Name = 'First name must be 2-20 characters';
    }
    if (formData.Last_Name && (formData.Last_Name.length < 2 || formData.Last_Name.length > 20)) {
      newErrors.Last_Name = 'Last name must be 2-20 characters';
    }
    if (formData.Age && (formData.Age < 5 || formData.Age > 80)) {
      newErrors.Age = 'Age must be between 5 and 80';
    }
    if (!formData.Email_Id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email_Id)) {
      newErrors.Email_Id = 'Valid email is required';
    }
    if (formData.Password && formData.Password.length < 6) {
      newErrors.Password = 'New password must be at least 6 characters';
    }
    if (formData.Password && !formData.Old_Password) {
      newErrors.Old_Password = 'Old password is required to update password';
    }
    if (formData.Old_Password && !formData.Password) {
      newErrors.Password = 'New password is required when providing old password';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setUploadError('No file selected');
      return;
    }
    try {
      setIsImageLoading(true);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only JPEG, PNG, or JPG files are allowed');
        setIsImageLoading(false);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setIsImageLoading(false);
        return;
      }
      // console.log('Selected file:', { name: file.name, size: file.size, type: file.type });
      const { data: signatureData } = await axiosClient.get('/user/photoupload/create');
      const { signature, timestamp, public_id, api_key, cloud_name, upload_url, upload_preset } = signatureData;
      // console.log('Signature Data from Backend:', signatureData);
      if (!signature || !timestamp || !public_id || !api_key || !upload_preset) {
        throw new Error('Incomplete signature data from backend');
      }
      if (upload_preset !== 'profile_photo_upload') {
        console.warn('Upload preset mismatch:', upload_preset);
        throw new Error(`Invalid upload preset: ${upload_preset}`);
      }
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('api_key', api_key);
      uploadFormData.append('timestamp', timestamp);
      uploadFormData.append('signature', signature);
      uploadFormData.append('public_id', public_id);
      uploadFormData.append('upload_preset', upload_preset);
      const formDataEntries = {};
      for (const [key, value] of uploadFormData.entries()) {
        formDataEntries[key] = value instanceof File ? value.name : value;
      }
      // console.log('FormData Entries:', formDataEntries);
      const response = await axios.post(upload_url, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cloudinaryResult = response.data;
      // console.log('Cloudinary Response:', cloudinaryResult);
      if (response.status !== 200) {
        throw new Error(cloudinaryResult.error?.message || 'Failed to upload photo to Cloudinary');
      }
      const { data } = await axiosClient.post('/user/photoupload/save', {
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
      });
      // console.log('Backend Save Response:', data);
      setUser(data.user);
      setFormData((prev) => ({
        ...prev,
        Profile_Photo: data.user.Profile_Photo,
        Profile_Photo_PublicId: data.user.Profile_Photo_PublicId,
      }));
      setUploadError(null);
      setIsImageLoading(false);
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to upload photo';
      console.error('Detailed Cloudinary Error:', err.response?.data || err);
      setUploadError(errorMessage);
      setIsImageLoading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;
    try {
      setIsImageLoading(true);
      await axiosClient.delete('/user/photoupload/delete');
      setUser((prev) => ({
        ...prev,
        Profile_Photo: '',
        Profile_Photo_PublicId: '',
      }));
      setFormData((prev) => ({
        ...prev,
        Profile_Photo: '',
        Profile_Photo_PublicId: '',
      }));
      setUploadError(null);
      setIsImageLoading(false);
    } catch (err) {
      console.error('Error deleting profile photo:', err);
      setUploadError(err.response?.data?.error || 'Failed to delete photo');
      setIsImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const updateData = {
        First_Name: formData.First_Name,
        Last_Name: formData.Last_Name,
        Age: formData.Age,
        Email_Id: formData.Email_Id,
      };
      if (formData.Password && formData.Old_Password) {
        updateData.Old_Password = formData.Old_Password;
        updateData.Password = formData.Password;
      }
      // console.log('Update profile data:', updateData);
      const { data } = await axiosClient.post('/user/EditProfile', updateData);
      setUser(data.user);
      setFormData((prev) => ({
        ...prev,
        Old_Password: '',
        Password: '',
      }));
      setErrors({});
      setIsSubmitting(false);
      navigate(`/profile/${user_id}`);
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      if (errorMessage === 'Incorrect old password') {
        setErrors({ Old_Password: 'Incorrect old password' });
      } else {
        setErrors({ general: errorMessage });
      }
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteProfile = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required to delete profile');
      return;
    }
    try {
      setIsSubmitting(true);
      const { data } = await axiosClient.post('/user/delete', { Password: deletePassword });
      // console.log(data);
      if (data.isdeleted) {
        setDeleteSuccess(true);
        dispatch(logoutUser());
        setTimeout(() => {
          navigate('/signup');
        }, 2000);
      }
    } catch (err) {
      console.error('Error deleting profile:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 'Failed to delete profile';
      setDeleteError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPasswordModal) {
          setShowPasswordModal(false);
          setDeletePassword('');
          setDeleteError(null);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPasswordModal, showDeleteConfirm]);

  if (loading || !user) {
    return (
      <div
        className={`flex justify-center items-center w-full min-h-screen ${
          isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Theme Toggle */}
      {/* <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 bg-gray-200 dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 z-50"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <Sun size={24} className="text-yellow-400" />
        ) : (
          <Moon size={24} className="text-gray-600" />
        )}
      </motion.button> */}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`p-8 rounded-2xl shadow-lg ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          } hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">Edit Profile</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/profile/${user_id}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              aria-label="Back to profile"
            >
              <ArrowLeft size={20} />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center mb-6">
              {formData.Profile_Photo && !isImageLoading ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={formData.Profile_Photo}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 dark:border-indigo-500 mr-6 shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.src = 'https://via.placeholder.com/96';
                  }}
                  onLoad={() => setIsImageLoading(false)}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center mr-6 shadow-sm">
                  {isImageLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 dark:border-indigo-400"></div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">No Photo</span>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Upload size={20} />
                  Upload Photo
                </motion.button>
                {formData.Profile_Photo && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handlePhotoDelete}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:from-red-700 hover:to-pink-700 transition-all duration-200"
                  >
                    <Trash2 size={20} />
                    Remove Photo
                  </motion.button>
                )}
                {uploadError && (
                  <p className="text-red-600 dark:text-red-400 mt-2 text-sm">{uploadError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">First Name</label>
              <input
                type="text"
                name="First_Name"
                value={formData.First_Name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                placeholder="Enter first name"
              />
              {errors.First_Name && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.First_Name}</p>
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">Last Name</label>
              <input
                type="text"
                name="Last_Name"
                value={formData.Last_Name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                placeholder="Enter last name (optional)"
              />
              {errors.Last_Name && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.Last_Name}</p>
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">Age</label>
              <input
                type="number"
                name="Age"
                value={formData.Age}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                placeholder="Enter age (optional)"
              />
              {errors.Age && <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.Age}</p>}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">Email</label>
              <input
                type="email"
                name="Email_Id"
                value={formData.Email_Id}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-gray-400 placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-400 placeholder-gray-500'
                } focus:outline-none cursor-not-allowed`}
                placeholder="Enter email"
                disabled
              />
              {errors.Email_Id && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.Email_Id}</p>
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">
                Old Password (required to update password)
              </label>
              <input
                type="password"
                name="Old_Password"
                value={formData.Old_Password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                placeholder="Enter old password"
              />
              {errors.Old_Password && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.Old_Password}</p>
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">New Password (optional)</label>
              <input
                type="password"
                name="Password"
                value={formData.Password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                placeholder="Enter new password"
              />
              {errors.Password && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errors.Password}</p>
              )}
            </div>

            {errors.general && (
              <p className="text-red-600 dark:text-red-400 mt-4 text-sm">{errors.general}</p>
            )}

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleDeleteConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:from-red-700 hover:to-pink-700 transition-all duration-200"
              >
                <Trash2 size={20} />
                Delete Profile
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
            role="dialog"
            aria-labelledby="delete-confirm-title"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-2xl p-6 max-w-md w-full shadow-2xl ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                aria-label="Close modal"
              >
                <X size={28} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                <h2 id="delete-confirm-title" className="text-xl font-bold">
                  Confirm Profile Deletion
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete your profile? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setShowPasswordModal(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:from-red-700 hover:to-pink-700 transition-all duration-200"
                >
                  Yes, Delete
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-xl shadow-md hover:bg-gray-300 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Confirmation Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => {
              setShowPasswordModal(false);
              setDeletePassword('');
              setDeleteError(null);
            }}
            role="dialog"
            aria-labelledby="password-modal-title"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-2xl p-6 max-w-md w-full shadow-2xl ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                aria-label="Close modal"
              >
                <X size={28} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                <h2 id="password-modal-title" className="text-xl font-bold">
                  Enter Password
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please enter your password to confirm profile deletion.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-300'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm mb-4`}
                placeholder="Enter your password"
              />
              {deleteError && (
                <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{deleteError}</p>
              )}
              {deleteSuccess && (
                <p className="text-green-600 dark:text-green-400 mb-4 text-sm">
                  Profile successfully deleted! Redirecting...
                </p>
              )}
              <div className="flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteProfile}
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:from-red-700 hover:to-pink-700 transition-all duration-200 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Deleting...' : 'Confirm'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-xl shadow-md hover:bg-gray-300 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;