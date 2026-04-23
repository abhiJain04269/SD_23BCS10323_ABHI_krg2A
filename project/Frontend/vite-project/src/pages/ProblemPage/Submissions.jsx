import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearHistory, fetchSubmissionHistory } from "../../../utils/Slice/SubmissionSlice";
import { X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const Submission = ({ pid, data: currentData }) => {
  console.log("my data :", currentData);
  const dispatch = useDispatch();
  const { history, lastFetched, currentPid, loading, error } = useSelector(
    (state) => state.submissions
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);

  useEffect(() => {
    if (currentData && Object.keys(currentData).length > 0) {
      const currentSubmissionTime = new Date(currentData.createdAt).getTime();
      // Only trigger animation for a new successful submission
      if (
        currentData.Status === "Accepted" &&
        (!lastSubmissionTime || currentSubmissionTime > lastSubmissionTime)
      ) {
        setShowSuccessAnimation(true);
        setLastSubmissionTime(currentSubmissionTime);
        // Auto-dismiss success animation after 5 seconds
        const timer = setTimeout(() => setShowSuccessAnimation(false), 5000);
        return () => clearTimeout(timer);
      }
      setShowCurrent(true);
      setSelectedSubmission(null);
    } else {
      setShowCurrent(false);
      setShowSuccessAnimation(false);
    }
  }, [currentData, lastSubmissionTime]);

  useEffect(() => {
    const shouldFetchHistory = () => {
      if (pid !== currentPid || lastFetched === 0) {
        console.log(`pid changed: ${currentPid} -> ${pid}, fetching history`);
        return true;
      } else if (currentData?.createdAt) {
        const lastSubmissionTime = new Date(currentData.createdAt).getTime();
        const shouldFetch = lastSubmissionTime > lastFetched;
        return shouldFetch;
      }
      console.log('No fetch needed');
      return false;
    };

    if (shouldFetchHistory()) {
      dispatch(clearHistory());
      dispatch(fetchSubmissionHistory(pid));
    }
  }, [pid, currentData?.createdAt, dispatch]);

  const handleCloseCurrent = () => {
    setShowCurrent(false);
    setShowSuccessAnimation(false);
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowCurrent(false);
    setShowSuccessAnimation(false);
  };

  const handleCloseSelected = () => {
    setSelectedSubmission(null);
  };

  if (loading) {
    return <div className="p-4">Loading submissions...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading submissions: {error}
        <button
          className="ml-4 btn btn-sm btn-primary"
          onClick={() => dispatch(fetchSubmissionHistory(pid))}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-base-200 rounded shadow h-[78vh] relative">
      {/* Success Animation for Accepted Submission */}
      <AnimatePresence>
        {showSuccessAnimation && currentData?.Status === "Accepted" && (
          <>
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
              gravity={0.2}
              className="absolute top-0 left-0 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white rounded-lg p-4 shadow-lg flex items-center gap-2 z-50 max-w-md"
              role="alert"
              aria-label="Submission Accepted"
            >
              <CheckCircle className="w-6 h-6 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold">Woohoo! Submission Accepted!</h3>
                <p className="text-sm">Great job! All test cases passed! 🎉</p>
              </div>
              <button
                onClick={() => setShowSuccessAnimation(false)}
                className="ml-4 text-white hover:text-gray-200"
                aria-label="Close success message"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showCurrent && currentData && !selectedSubmission ? (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Current Submission</h2>
            <button onClick={handleCloseCurrent} aria-label="Close current submission">
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <p>
              Status: <span className={`font-medium ${currentData.Status === "Accepted" ? "text-green-500" : "text-red-500"}`}>{currentData.Status}</span>
            </p>
            <p>
              Test Cases Passed: {currentData.TestCasesPassed} /{' '}
              {currentData.TotalTestCases}
            </p>
            <p>Time: {currentData.Time} ms</p>
            <p>Memory: {currentData.Memory} KB</p>
            {currentData.Error && (
              <p className="text-red-500">Error: {currentData.Error}</p>
            )}
            <pre className="bg-base-100 p-2 mt-2 rounded text-sm overflow-x-auto">
              {currentData.Code}
            </pre>
          </div>
        </div>
      ) : selectedSubmission ? (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Submission #{history.findIndex(sub => sub._id === selectedSubmission._id) + 1}</h2>
            <button onClick={handleCloseSelected} aria-label="Close selected submission">
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <p>
              Status: <span className={`font-medium ${selectedSubmission.Status === "Accepted" ? "text-green-500" : "text-red-500"}`}>{selectedSubmission.Status}</span>
            </p>
            <p>
              Test Cases Passed: {selectedSubmission.TestCasesPassed} /{' '}
              {selectedSubmission.TotalTestCases}
            </p>
            <p>Time: {selectedSubmission.Time} ms</p>
            <p>Memory: {selectedSubmission.Memory} KB</p>
            {selectedSubmission.Error && (
              <p className="text-red-500">Error: {selectedSubmission.Error}</p>
            )}
            <pre className="bg-base-100 p-2 mt-2 rounded text-sm overflow-x-auto">
              {selectedSubmission.Code}
            </pre>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold mb-2">Submission History</h2>
          {history.length === 0 ? (
            <p>No previous submissions found.</p>
          ) : (
            <ul className="space-y-3 h-[70vh] overflow-y-auto pr-2">
              {history.map((sub, index) => (
                <li
                  key={sub._id || index}
                  className="flex flex-wrap items-center justify-between p-3 rounded bg-base-100 text-sm gap-4 cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => handleSelectSubmission(sub)}
                  aria-label={`View submission ${index + 1}`}
                >
                  <span>
                    Status: <span className={`font-medium ${sub.Status === "Accepted" ? "text-green-500" : "text-red-500"}`}>{sub.Status}</span>
                  </span>
                  <span>Time: {sub.Time} ms</span>
                  <span>Memory: {sub.Memory} KB</span>
                  {sub.Error && (
                    <span className="text-red-500 truncate max-w-[200px]">
                      Error: {sub.Error}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Submitted: {new Date(sub.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Submission;