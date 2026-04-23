import {
  useParams,
  NavLink,
  Link,
  useLocation,
  useNavigate,
} from "react-router"; // Corrected import
import axiosClient from "../../../utils/axiosClient";
import { useEffect, useState, useRef } from "react";
import DescriptionCompo from "./Discription";
import Submission from "./Submissions";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../../utils/Slice/authSlice";
import Ai from "./Ai";
import { adduserMessage, clearHistory } from "../../../utils/Slice/chatSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import Discussion from "./Discussion";
import Solution from "./Solution";
import { GoArrowLeft } from "react-icons/go";

const ProblemPage = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const editorRef = useRef(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedLang, setSelectedLang] = useState("C++");
  const [problemData, setProblemData] = useState(null);
  const [code, setCode] = useState("");
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [runResult, setRunResult] = useState([]);
  const [submitResult, setSubmitResult] = useState({});
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTestCasesOpen, setIsTestCasesOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSolved, setIsSolved] = useState(location.state?.isSolved || false);
  const [solutionViewed, setSolutionViewed] = useState(
    location.state?.viewedSolution
  );
  const [editorSize, setEditorSize] = useState({
    width: window.innerWidth * 0.48,
    height: window.innerHeight * 0.5 - 32,
  });
  const dispatch = useDispatch();
  const languageOptions = ["C++", "Java", "Python"];

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (location.state?.viewedSolution !== undefined) {
      setSolutionViewed(location.state.viewedSolution);
    }
  }, [location.state?.viewedSolution]);

  // Map language to Monaco editor language
  const mapLanguage = (lang) => {
    switch (lang) {
      case "Java":
        return "java";
      case "Python":
        return "python";
      case "C++":
        return "cpp";
      default:
        return "javascript";
    }
  };

  // Judge0 status mapping
  const statusMap = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error",
  };

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle window resize and test case toggle
  useEffect(() => {
    const updateEditorSize = () => {
      const newHeight = isTestCasesOpen
        ? window.innerHeight * 0.5 - 32
        : window.innerHeight * 0.8 - 32;
      const newWidth = window.innerWidth * 0.48 - 32;
      setEditorSize({ width: newWidth, height: newHeight });
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };
    const debouncedResize = debounce(updateEditorSize, 100);
    window.addEventListener("resize", debouncedResize);
    updateEditorSize();
    return () => window.removeEventListener("resize", debouncedResize);
  }, [isTestCasesOpen]);

  // Fetch problem data and submission history
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await axiosClient.get(`/problem/problemById/${id}`);
        setProblemData(response.data);
      } catch (error) {
        console.error("Error fetching problem:", error);
        setStatus("Error fetching problem");
      }
    };

    const fetchSubmissionHistory = async () => {
      if (
        !isAuthenticated ||
        !user?._id ||
        location.state?.isSolved !== undefined
      )
        return;
      try {
        const response = await axiosClient.get(
          `/submission/history/${id}/${user._id}`
        );
        const submissions = response.data;
        const solved = submissions.some(
          (submission) => submission.status_id === 3
        );
        setIsSolved(solved);
      } catch (error) {
        console.error("Error fetching submission history:", error);
      }
    };

    if (id) {
      fetchProblem();
      fetchSubmissionHistory();
    }
  }, [id, isAuthenticated, user, location.state]);

  // Clear chat history when problem ID changes
  useEffect(() => {
    dispatch(clearHistory());
  }, [id, dispatch]);

  // Set initial code based on selected language
  useEffect(() => {
    if (!problemData) return;
    const langIndex = { "C++": 0, Java: 1, Python: 2 };
    const initialCode =
      problemData.StartCode?.[langIndex[selectedLang]]?.initialCode || "";
    setCode(initialCode);
    setStatus("");
    setRunResult([]);
  }, [selectedLang, problemData]);

  // Monaco editor mount handler
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.layout();
  };

  // Reset code to initial state
  const resetCode = () => {
    const langIndex = { "C++": 0, Java: 1, Python: 2 };
    const initialCode =
      problemData?.StartCode?.[langIndex[selectedLang]]?.initialCode || "";
    setCode(initialCode);
    setStatus("");
    setRunResult([]);
  };

  // Run code against visible test cases
  const run = async () => {
    if (isRunning || !editorRef.current) return;
    setIsRunning(true);
    setSelectedCaseIndex(problemData?.VisibleTestCases?.length || 0);
    setStatus("");
    const payload = {
      Language: mapLanguage(selectedLang),
      Code: editorRef.current.getValue(),
      ProblemId: id,
    };
    try {
      const response = await axiosClient.post("/submission/run", payload);
      const results = Array.isArray(response.data) ? response.data : [];
      setRunResult(results);
      if (results.length === 0) {
        setStatus("No test results returned");
      } else {
        const allAccepted = results.every((result) => result.status_id === 3);
        const overallStatus = allAccepted
          ? "Accepted"
          : statusMap[results[0]?.status_id] || "Error";
        setStatus(overallStatus);
      }
    } catch (error) {
      console.error(
        "Error running code:",
        error.response?.data || error.message
      );
      setStatus("Error running code");
      setRunResult([
        { error: error.response?.data?.message || "Failed to run code" },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for full evaluation
  const submit = async () => {
    if (isSubmitting || !editorRef.current) return;
    setIsSubmitting(true);
    setStatus("");
    const payload = {
      Language: mapLanguage(selectedLang),
      Code: editorRef.current.getValue(),
      ProblemId: id,
    };
    try {
      const response = await axiosClient.post("/submission/submit", payload);
      setSubmitResult(response.data.submission);
      let overallStatus = "Error";
      if (response.data.submission) {
        overallStatus =
          statusMap[response.data.submission.status_id] ||
          response.data.submission.Status || "Error";
        if (response.data.submission.status_id === 3) {
          setIsSolved(true);
        }
      } else if (Array.isArray(response.data)) {
        const results = response.data;
        if (results.length === 0) {
          overallStatus = "No test results returned";
        } else {
          const allAccepted = results.every((result) => result.status_id === 3);
          overallStatus = allAccepted
            ? "Accepted"
            : statusMap[results[0]?.status_id] || "Error";
          if (allAccepted) {
            setIsSolved(true);
          }
        }
      }
      setStatus(overallStatus);
      setActiveTab("Submissions");
      setIsTestCasesOpen(true);
    } catch (error) {
      console.error(
        "Error submitting code:",
        error.response?.data || error.message
      );
      setStatus("Error submitting code");
      setSubmitResult({
        error: error.response?.data?.message || "Failed to submit code",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle viewing solution
  const handleViewSolution = () => {
    setActiveTab("Solution");
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
  };

  // Toggle dropdowns
  const toggleLanguageDropdown = () => {
    setIsLanguageOpen((prev) => !prev);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
    setIsLanguageOpen(false);
  };

  const toggleTestCases = () => {
    setIsTestCasesOpen((prev) => !prev);
  };

  // Handle editor resize
  const handleResize = (e, { size }) => {
    const newHeight = isTestCasesOpen
      ? window.innerHeight * 0.5 - 32
      : window.innerHeight * 0.8 - 32;
    const newWidth = window.innerWidth * 0.48 - 32;
    setEditorSize({
      width: newWidth,
      height: Math.min(size.height, newHeight),
    });
    if (editorRef.current) {
      editorRef.current.layout();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <style>
        {`
          .react-resizable {
            position: relative;
            width: 100% !important;
          }
          .react-resizable-handle {
            background-color: #e2e8f0;
            border-radius: 4px;
            z-index: 10;
          }
          .react-resizable-handle-se {
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            cursor: se-resize;
          }
          .monaco-editor-container {
            width: 100% !important;
            height: 100% !important;
            overflow: hidden;
          }
        `}
      </style>

      {/* Top Bar */}
      <header>
        <div
          className="flex justify-between items-center px-8 py-4 shadow-md sticky top-0 z-50 bg-teal-600 dark:bg-teal-800 text-white"
        >
          <Link to="/home">
            <button className="text-4xl font-extrabold tracking-tight cursor-pointer">
              CodeVibin
            </button>
          </Link>
          <div className="absolute top-4 right-4 z-50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleUserMenu}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 dark:bg-teal-700 text-white rounded-lg shadow-md hover:bg-teal-400 dark:hover:bg-teal-600 transition-colors duration-200"
              aria-label="Toggle user menu"
            >
              <span>{user?.UserName || "User"}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.button>
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 rounded-lg shadow-xl z-50"
                >
                  <li>
                    <Link to="/logout" className="hover:text-blue-200">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
                        onClick={handleLogout}
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </Link>
                  </li>
                  {isAuthenticated && (
                    <li>
                      <NavLink
                        to={`/profile/${user?._id}`}
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </NavLink>
                    </li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex items-center py-4 px-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="px-4 py-2 bg-teal-500 dark:bg-teal-700 text-white rounded-lg shadow-md transition-colors duration-200 hover:bg-teal-400 dark:hover:bg-teal-600"
          aria-label="Go back to previous page"
        >
          <GoArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex gap-4 mx-auto">
          <motion.button
            whileHover={{ scale: isRunning ? 1 : 1.05 }}
            whileTap={{ scale: isRunning ? 1 : 0.95 }}
            className={`px-4 py-2 bg-teal-500 dark:bg-teal-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2 ${
              isRunning
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-teal-400 dark:hover:bg-teal-600"
            }`}
            onClick={run}
            disabled={isRunning}
            aria-label="Run code"
          >
            {isRunning && (
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Run
          </motion.button>
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
            className={`px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2 ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-400 dark:hover:bg-blue-600"
            }`}
            onClick={submit}
            disabled={isSubmitting}
            aria-label="Submit code"
          >
            {isSubmitting && (
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Submit
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-row flex-1 overflow-hidden relative">
        {/* Left Section */}
        <div className="w-1/2 p-4 pt-0 h-full overflow-y-auto">
          <div className="flex flex-row mb-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 bg-gray-50 dark:bg-slate-900">
            {[
              "Description",
              "Editorial",
              "Solution",
              "Submissions",
              "AI",
              "Discussion",
            ].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`pb-2 px-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300"
                }`}
                onClick={() =>
                  tab === "Solution" ? handleViewSolution() : setActiveTab(tab)
                }
                aria-label={`Switch to ${tab} tab`}
              >
                {tab}
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-0"
            >
              {activeTab === "Description" && (
                <div>
                  <DescriptionCompo data={problemData} isSolved={isSolved} />
                  {problemData?.points && (
                    <div className="mt-2 text-gray-600 dark:text-gray-300">
                      {/* <strong>Points:</strong> {problemData.points} */}
                    </div>
                  )}
                  {problemData?.Constraints?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                    >
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Constraints
                      </h3>
                      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md p-4">
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                          {problemData.Constraints.map((constraint, index) => (
                            <li key={index}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {activeTab === "Editorial" && (
                <div className="text-gray-600 dark:text-gray-300">
                  Editorial coming soon
                </div>
              )}
              {activeTab === "Solution" && (
                <Solution
                  problemData={problemData}
                  solutionViewed={solutionViewed}
                  setSolutionViewed={setSolutionViewed}
                  setActiveTab={setActiveTab}
                  pid={id}
                />
              )}
              {activeTab === "Submissions" && (
                <div>
                  <Submission pid={id} data={submitResult} />
                  {submitResult?.pointsEarned !== undefined && (
                    <div className="mt-2 text-gray-600 dark:text-gray-300">
                      <p>
                        <strong>Points Earned:</strong>{" "}
                        {submitResult.pointsEarned}
                      </p>
                      <p>
                        <strong>Total Points:</strong>{" "}
                        {submitResult.totalPoints}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "AI" && <Ai pid={id} />}
              {activeTab === "Discussion" && <Discussion pid={id} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="w-1/2 p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="relative mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguageDropdown}
                className="flex items-center space-x-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                aria-label="Toggle language dropdown"
              >
                <span>{selectedLang}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isLanguageOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.button>
              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute mt-2 w-52 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 rounded-lg shadow-xl z-50"
                  >
                    {languageOptions.map((option) => (
                      <li key={option}>
                        <button
                          onClick={() => {
                            setSelectedLang(option);
                            setIsLanguageOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
                          aria-label={`Select ${option} language`}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetCode}
              className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200"
              aria-label="Clear code"
            >
              Clear Code
            </motion.button>
          </div>
          {problemData && (
            <Resizable
              width={editorSize.width}
              height={editorSize.height}
              onResize={handleResize}
              minConstraints={[300, 300]}
              maxConstraints={[
                window.innerWidth * 0.48 - 32,
                isTestCasesOpen
                  ? window.innerHeight * 0.5 - 32
                  : window.innerHeight * 0.8 - 32,
              ]}
              handle={
                <span className="react-resizable-handle react-resizable-handle-se" />
              }
            >
              <div
                className="monaco-editor-container"
                style={{ width: "100%", height: editorSize.height }}
              >
                <Editor
                  height="100%"
                  width="100%"
                  language={mapLanguage(selectedLang)}
                  value={code}
                  onChange={(newValue) => setCode(newValue || "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    padding: { top: 20, bottom: 20 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  onMount={handleEditorDidMount}
                  className="border border-gray-200 dark:border-slate-600 rounded-lg"
                />
              </div>
            </Resizable>
          )}
          <div className="mt-4 mb-4 flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTestCases}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded-lg shadow-md hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors duration-200"
              aria-label={
                isTestCasesOpen ? "Hide test cases" : "Show test cases"
              }
            >
              {isTestCasesOpen ? "Hide Test Cases" : "Show Test Cases"}
            </motion.button>
          </div>
          <AnimatePresence>
            {isTestCasesOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Test Cases
                </h3>
                <div className="max-h-[200px] overflow-y-auto bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md p-4">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {problemData?.VisibleTestCases?.map((_, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          selectedCaseIndex === index
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"
                        } transition-colors duration-200`}
                        onClick={() => setSelectedCaseIndex(index)}
                        aria-label={`Select test case ${index + 1}`}
                      >
                        Case {index + 1}
                      </motion.button>
                    ))}
                    {problemData?.VisibleTestCases?.length > 0 ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          selectedCaseIndex ===
                          problemData.VisibleTestCases.length
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"
                        } transition-colors duration-200`}
                        onClick={() =>
                          setSelectedCaseIndex(
                            problemData.VisibleTestCases.length
                          )
                        }
                        aria-label="View test results"
                      >
                        Test Result
                      </motion.button>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">
                        No test cases available
                      </p>
                    )}
                  </div>
                  {problemData?.VisibleTestCases?.length > 0 &&
                    selectedCaseIndex < problemData.VisibleTestCases.length && (
                      <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                          Test Case {selectedCaseIndex + 1}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          <strong>Input:</strong>{" "}
                          {
                            problemData.VisibleTestCases[selectedCaseIndex]
                              .Input
                          }
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <strong>Expected Output:</strong>{" "}
                          {
                            problemData.VisibleTestCases[selectedCaseIndex]
                              .Output
                          }
                        </p>
                      </div>
                    )}
                  {problemData?.VisibleTestCases?.length > 0 &&
                    selectedCaseIndex ===
                      problemData.VisibleTestCases.length && (
                      <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                          Test Results
                        </h4>
                        {runResult?.[0]?.error ? (
                          <p className="text-rose-600 dark:text-rose-400">
                            {runResult[0].error}
                          </p>
                        ) : runResult.length === 0 ? (
                          <p className="text-gray-600 dark:text-gray-300">
                            No test results available
                          </p>
                        ) : (
                          problemData.VisibleTestCases.map(
                            (testCase, index) => (
                              <div key={index} className="mb-2">
                                <pre className="text-gray-600 dark:text-gray-300">
                                  <strong>Input:</strong> {testCase.Input}
                                </pre>
                                <pre className="text-gray-600 dark:text-gray-300">
                                  <strong>Expected Output:</strong>{" "}
                                  {testCase.Output}
                                </pre>
                                <pre className="text-gray-600 dark:text-gray-300">
                                  <strong>Output:</strong>{" "}
                                  {runResult[index]
                                    ? runResult[index].stdout || "No output"
                                    : "No result available"}
                                </pre>
                                <pre
                                  className={`text-sm ${
                                    runResult[index]?.status_id === 3
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  <strong>Status:</strong>{" "}
                                  {runResult[index]
                                    ? statusMap[runResult[index].status_id] ||
                                      "Unknown"
                                    : "Pending"}
                                </pre>
                                {runResult[index]?.stderr && (
                                  <pre className="text-rose-600 dark:text-rose-400">
                                    <strong>Error:</strong>{" "}
                                    {runResult[index].stderr}
                                  </pre>
                                )}
                                <hr className="my-2 border-gray-200 dark:border-slate-700" />
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;