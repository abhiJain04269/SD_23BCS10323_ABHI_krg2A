import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../../utils/axiosClient';
import { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

const Solution = ({ problemData, solutionViewed, setSolutionViewed, setActiveTab, pid, onFetchSolution }) => {
  const [showLockScreen, setShowLockScreen] = useState(!solutionViewed);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync showLockScreen with solutionViewed
  useEffect(() => {
    setShowLockScreen(!solutionViewed);
  }, [solutionViewed]);

  // console.log('Solution Component:', { solutionViewed, showLockScreen, showConfirmation, problemData });

  const handleLockScreenClick = () => {
    setShowLockScreen(false);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      // console.log('Calling API for /problem/view-solution/', pid);
      const response = await axiosClient.post(`/problem/view-solution/${pid}`);
      // console.log('API Response:', response);
      // console.log(response.data.message);
      setSolutionViewed(true);
      setShowConfirmation(false);
      setActiveTab('Solution');

      // If the API doesn't return solution data, fetch problemData
      if (!problemData?.RefCode?.length && onFetchSolution) {
        await onFetchSolution(pid);
      }
    } catch (error) {
      console.error('Failed to record solution view:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to record solution view');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setShowLockScreen(true);
    setActiveTab('Description');
  };

  return (
    <div className="relative text-gray-600 dark:text-gray-300 h-[85vh]">
      <AnimatePresence>
        {showLockScreen && !solutionViewed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-100 dark:bg-slate-800 bg-opacity-90 flex items-center justify-center rounded-lg"
            onClick={handleLockScreenClick}
            role="button"
            aria-label="Unlock solution"
          >
            <div className="text-center">
              <Lock className="mx-auto mb-2 text-gray-600 dark:text-gray-300" size={48} />
              <p className="text-gray-600 dark:text-gray-300 font-semibold">
                Click to view the solution
              </p>
            </div>
          </motion.div>
        )}
        {showConfirmation && !solutionViewed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white dark:bg-slate-800 rounded-lg p-6"
          >
            <button
              onClick={handleCancel}
              className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              aria-label="Close confirmation"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Confirm Solution View
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Viewing the solution will prevent earning points for this problem. Are you sure you want to continue?
            </p>
            {error && <p className="text-rose-600 dark:text-rose-400 mb-4">{error}</p>}
            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200"
                aria-label="Cancel"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors duration-200"
                aria-label="Confirm"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        )}
        {!showLockScreen && !showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <p>Loading solution...</p>
            ) : solutionViewed ? (
              problemData?.RefCode?.length > 0 ? (
                <>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Solution</h3>
                  {problemData.RefCode.map((solution, index) => (
                    <div key={index} className="mb-4">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">{solution.language}</h4>
                      <pre className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                        <code>{solution.CompleteCode}</code>
                      </pre>
                    </div>
                  ))}
                  <p className="text-rose-600 dark:text-rose-400">
                    Note: You cannot earn points for this problem because you viewed the solution.
                  </p>
                </>
              ) : (
                <p>No solution available.</p>
              )
            ) : (
              <p>Loading solution...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Solution;