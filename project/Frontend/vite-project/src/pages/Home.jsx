import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router"; // Updated import to use react-router-dom
import axiosClient from "../../utils/axiosClient";
import { logoutUser } from "../../utils/Slice/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, CheckCircle, Moon, Sun } from "lucide-react";

function Home() {
  const { user, error, isAuthenticated, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  const [allproblems, setAllProblems] = useState([]);
  const [userSolvedProblem, setUserSolvedProblem] = useState([]);
  const [filterType, setFilterType] = useState("All Problems");
  const [difficulty, setDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [isFilterTypeOpen, setIsFilterTypeOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const topics = [
    "all",
    "Array",
    "String",
    "Tree",
    "Graph",
    "Dynamic Programming",
    "HashMap",
    "Binary Search",
  ];

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

  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/getAllProblem");
        // console.log("All Problems:", response.data);
        const normalizedData = response.data.map((problem) => ({
          ...problem,
          DifficultyLevel: problem.DifficultyLevel || "unknown",
        }));
        normalizedData.forEach((problem, index) => {
          if (problem.DifficultyLevel === "unknown") {
            console.warn(`Problem at index ${index} has no DifficultyLevel:`, problem);
          }
        });
        setAllProblems(normalizedData);
      } catch (error) {
        console.error("Error fetching problems:", error);
        setAllProblems([]);
      }
    };

    const fetchUserProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/problemSolvedByUser");
        // console.log("User Solved Problems Raw Response:", response.data);
        const normalizedData = response.data.map((problem) => ({
          ...problem,
          problemId: {
            ...problem.problemId,
            DifficultyLevel: problem.problemId?.DifficultyLevel || "unknown",
            Description: problem.problemId?.Description || "No description available",
            Title: problem.problemId?.Title || "Untitled",
            TopicTag: problem.problemId?.TopicTag || "unknown",
          },
          viewedSolution: problem.viewedSolution ?? false,
        }));
        normalizedData.forEach((problem, index) => {
          if (!problem.problemId?.DifficultyLevel) {
            console.warn(`User problem at index ${index} has no DifficultyLevel:`, problem);
          }
          if (problem.viewedSolution === undefined) {
            console.warn(`User problem at index ${index} has no viewedSolution:`, problem);
          }
          if (!problem.problemId?.Description) {
            console.warn(`User problem at index ${index} has no Description:`, problem);
          }
        });
        // console.log("Normalized User Solved Problems:", normalizedData);
        setUserSolvedProblem(normalizedData);
      } catch (error) {
        console.error("Error fetching user problems:", error);
        setUserSolvedProblem([]);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAllProblems(), fetchUserProblems()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const baseProblems =
    filterType === "Solved Problems" ? userSolvedProblem : allproblems;

  const filteredProblems = Array.isArray(baseProblems)
    ? baseProblems.filter((problem) => {
        const problemData = filterType === "Solved Problems" ? problem.problemId : problem;
        if (
          difficulty !== "all" &&
          problemData?.DifficultyLevel?.toLowerCase() !== difficulty.toLowerCase()
        ) {
          return false;
        }
        if (
          searchQuery &&
          !problemData?.Title?.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (
          selectedTopic !== "all" &&
          problemData?.TopicTag?.toLowerCase() !== selectedTopic.toLowerCase()
        ) {
          return false;
        }
        return true;
      })
    : [];

  const isProblemSolved = (problemId) => {
    return userSolvedProblem.some((solved) => solved.problemId?._id === problemId);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
  };

  const toggleFilterType = () => {
    setIsFilterTypeOpen(!isFilterTypeOpen);
    setIsDifficultyOpen(false);
    setIsTopicOpen(false);
    setIsUserMenuOpen(false);
  };

  const toggleDifficulty = () => {
    setIsDifficultyOpen(!isDifficultyOpen);
    setIsFilterTypeOpen(false);
    setIsTopicOpen(false);
    setIsUserMenuOpen(false);
  };

  const toggleTopic = () => {
    setIsTopicOpen(!isTopicOpen);
    setIsFilterTypeOpen(false);
    setIsDifficultyOpen(false);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsFilterTypeOpen(false);
    setIsDifficultyOpen(false);
    setIsTopicOpen(false);
  };

  if (error || !isAuthenticated) {
    return (
      <div
        className={`flex flex-col justify-center items-center w-full min-h-screen ${
          isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <p className="text-red-600 dark:text-red-400 mb-4 text-lg">
          {error || 'You must be logged in to view this page.'}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
        >
          Login
        </motion.button>
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

      {/* Header */}
      <header
        className={`flex justify-between items-center px-8 py-4 shadow-md sticky top-0 z-50 ${
          isDarkMode ? 'bg-teal-800' : 'bg-teal-600'
        } text-white`}
      >
        <h1 className="text-4xl font-extrabold tracking-tight">CodeVibin</h1>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
            aria-label="User menu"
          >
            <span>{user?.UserName || "User"}</span>
            <ChevronDown
              size={20}
              className={`transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
            />
          </motion.button>
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-hidden ${
                  isDarkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-900'
                }`}
              >
                <li>
                  <NavLink
                    to="/logout"
                    className={({ isActive }) =>
                      `block px-4 py-2 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        isActive ? "bg-gray-100 dark:bg-slate-700" : ""
                      }`
                    }
                    onClick={handleLogout}
                  >
                    Logout
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={user?._id ? `/profile/${user._id}` : "#"}
                    className={({ isActive }) =>
                      `block px-4 py-2 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        isActive ? "bg-gray-100 dark:bg-slate-700" : ""
                      }`
                    }
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                </li>
                {user?.Role === "admin" && (
                  <li>
                    <NavLink
                      to="/adminPannel"
                      className={({ isActive }) =>
                        `block px-4 py-2 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                          isActive ? "bg-gray-100 dark:bg-slate-700" : ""
                        }`
                      }
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Admin
                    </NavLink>
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {/* Filters */}
  <div className="flex flex-wrap gap-4 mb-8 items-center">
    {/* Problem Filter */}
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleFilterType}
        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-800 text-gray-200 hover:bg-slate-700'
            : 'bg-white text-gray-600 hover:bg-blue-50'
        }`}
        aria-expanded={isFilterTypeOpen}
        aria-controls="filter-type-menu"
      >
        <span>{filterType}</span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-200 ${isFilterTypeOpen ? "rotate-180" : ""}`}
        />
      </motion.button>
      <AnimatePresence>
        {isFilterTypeOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-hidden ${
              isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-600'
            }`}
            id="filter-type-menu"
          >
            <li>
              <button
                onClick={() => {
                  setFilterType("Solved Problems");
                  setIsFilterTypeOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                Solved Problems
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setFilterType("All Problems");
                  setIsFilterTypeOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                All Problems
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>

    {/* Difficulty Filter */}
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDifficulty}
        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-800 text-gray-200 hover:bg-slate-700'
            : 'bg-white text-gray-600 hover:bg-blue-50'
        }`}
        aria-expanded={isDifficultyOpen}
        aria-controls="difficulty-menu"
      >
        <span>
          {difficulty === "all"
            ? "All Difficulties"
            : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-200 ${isDifficultyOpen ? "rotate-180" : ""}`}
        />
      </motion.button>
      <AnimatePresence>
        {isDifficultyOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-hidden ${
              isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-600'
            }`}
            id="difficulty-menu"
          >
            <li>
              <button
                onClick={() => {
                  setDifficulty("easy");
                  setIsDifficultyOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                Easy
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setDifficulty("medium");
                  setIsDifficultyOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                Medium
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setDifficulty("hard");
                  setIsDifficultyOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                Hard
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setDifficulty("all");
                  setIsDifficultyOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                All
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>

    {/* Topic Filter */}
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTopic}
        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-800 text-gray-200 hover:bg-slate-700'
            : 'bg-white text-gray-600 hover:bg-blue-50'
        }`}
        aria-expanded={isTopicOpen}
        aria-controls="topic-menu"
      >
        <span>{selectedTopic === "all" ? "All Topics" : selectedTopic}</span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-200 ${isTopicOpen ? "rotate-180" : ""}`}
        />
      </motion.button>
      <AnimatePresence>
        {isTopicOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-y-auto max-h-64 ${
              isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-600'
            }`}
            id="topic-menu"
          >
            {topics.map((topic) => (
              <li key={topic}>
                <button
                  onClick={() => {
                    setSelectedTopic(topic);
                    setIsTopicOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
                >
                  {topic === "all" ? "All Topics" : topic}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>

    {/* Search Bar */}
    <div className="relative">
  <Search className="absolute left-4 top-3 text-gray-400" size={20} />
  <input
    type="text"
    placeholder="Search problems..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className={`w-64 pl-12 pr-4 py-2.5 rounded-xl shadow-md outline-none transition-all duration-200 ${
      isDarkMode
        ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 focus:border-transparent'
        : 'bg-white text-gray-600 hover:bg-blue-50 focus:border-transparent'
    }`}
    aria-label="Search problems"
  />
</div>
  </div>

        {/* Problems Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            <div className="col-span-full text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-2">
                Loading problems...
              </p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400 text-lg font-medium">
              No matching problems found.
            </p>
          ) : (
            filteredProblems.map((problem, idx) => {
              const problemData = filterType === "Solved Problems" ? problem.problemId : problem;
              return (
                <motion.div
                  key={problemData?._id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <NavLink
                    to={`/problemById/${problemData?._id}`}
                    state={{
                      isSolved: isProblemSolved(problemData?._id),
                      viewedSolution:
                        userSolvedProblem.find(
                          (solved) =>
                            solved &&
                            solved.problemId &&
                            solved.problemId._id === problemData?._id
                        )?.viewedSolution ?? false,
                    }}
                  >
                    <div
                      className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {problemData?.Title || "Untitled"}
                        </h3>
                        {isProblemSolved(problemData?._id) && (
                          <CheckCircle
                            size={20}
                            className="text-green-500 dark:text-green-400"
                            aria-label="Problem solved"
                          />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {problemData?.Description || "No description available"}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          problemData?.DifficultyLevel?.toLowerCase() === "easy"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
                            : problemData?.DifficultyLevel?.toLowerCase() === "medium"
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
                            : problemData?.DifficultyLevel?.toLowerCase() === "hard"
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {problemData?.DifficultyLevel
                          ? problemData.DifficultyLevel.charAt(0).toUpperCase() +
                            problemData.DifficultyLevel.slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  </NavLink>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default Home;