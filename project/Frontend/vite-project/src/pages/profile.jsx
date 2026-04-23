import { useParams, useNavigate, Navigate } from "react-router"; // Updated import
import { useSelector } from "react-redux";
import axiosClient from "../../utils/axiosClient";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit2, X, RefreshCw, Moon, Sun } from "lucide-react"; // Added Moon, Sun for theme toggle
import { GoArrowLeft } from "react-icons/go";
import { NavLink } from "react-router"; // Added for user menu navigation
import { logoutUser } from "../../utils/Slice/authSlice"; // Added for logout functionality

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Profile = () => {
  const { user_id } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    Total_Problems_Solved: 0,
    Total_Points: 0,
    Problems_Solved_Titles: [],
    Solved_By_Difficulty: { easy: 0, medium: 0, hard: 0, unknown: 0 },
    Solved_By_Topic: {},
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState({
    profile: true,
    difficulty: true,
    topic: true,
    problems: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Added for user menu dropdown

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  // Sync with system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Toggle theme manually
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserMenuOpen(false);
  };

  // Toggle user menu
  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const fetchSolvedProblems = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get("/problem/problemSolvedByUser");
      // console.log(response.data);
      const problem_solved = response.data || [];
      const totalSolved = problem_solved.length;
      const totalPoints = problem_solved.reduce(
        (acc, curr) => acc + (curr.pointsEarned || 0),
        0
      );
      const problemsSolvedTitles = problem_solved.map(
        (p) => p.problemId?.Title || "Unknown Title"
      );
      const difficultyCount = problem_solved.reduce(
        (acc, curr) => {
          const level =
            curr.problemId?.DifficultyLevel?.toLowerCase() || "unknown";
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0, unknown: 0 }
      );
      const topicCount = problem_solved.reduce((acc, curr) => {
        const tags = Array.isArray(curr.problemId?.TopicTag)
          ? curr.problemId.TopicTag
          : typeof curr.problemId?.TopicTag === "string"
          ? [curr.problemId.TopicTag]
          : [];
        tags.forEach((tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {});
      setDashboardData({
        Total_Problems_Solved: totalSolved,
        Total_Points: totalPoints,
        Problems_Solved_Titles: problemsSolvedTitles,
        Solved_By_Difficulty: difficultyCount,
        Solved_By_Topic: topicCount,
      });
      setError(null);
    } catch (err) {
      console.error(
        "Error fetching solved problems:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.error || "Failed to load solved problems");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id || user._id !== user_id) {
      setError("User not authenticated or incorrect user ID");
      return;
    }
    setProfileData(user);
    fetchSolvedProblems();
  }, [user_id, user, isAuthenticated]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage("");
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const difficultyChartData = {
    labels: ["Easy", "Medium", "Hard", "Unknown"],
    datasets: [
      {
        label: "Problems by Difficulty",
        data: [
          dashboardData.Solved_By_Difficulty.easy,
          dashboardData.Solved_By_Difficulty.medium,
          dashboardData.Solved_By_Difficulty.hard,
          dashboardData.Solved_By_Difficulty.unknown,
        ],
        backgroundColor: ["#4ade80", "#facc15", "#f87171", "#a1a1aa"],
        borderColor: ["#15803d", "#a16207", "#b91c1c", "#52525b"],
        borderWidth: 1,
      },
    ],
  };

  const topicChartData = {
    labels: Object.keys(dashboardData.Solved_By_Topic),
    datasets: [
      {
        label: "Problems by Topic",
        data: Object.values(dashboardData.Solved_By_Topic),
        backgroundColor: [
          "#3b82f6",
          "#4ade80",
          "#facc15",
          "#f87171",
          "#c084fc",
          "#ec4899",
        ],
        borderColor: [
          "#1e40af",
          "#15803d",
          "#a16207",
          "#b91c1c",
          "#7e22ce",
          "#be185d",
        ],
        borderWidth: 1,
      },
    ],
  };

  const filteredProblems = dashboardData.Problems_Solved_Titles.filter(
    (title) => title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div
        className={`flex flex-col justify-center items-center w-full min-h-screen ${
          isDarkMode ? "bg-slate-900 text-gray-100" : "bg-gray-50 text-gray-900"
        }`}
      >
        <p className="text-red-600 mb-4 text-lg">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchSolvedProblems}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          <RefreshCw size={18} />
          Retry
        </motion.button>
      </div>
    );
  }

  if (!profileData || isLoading) {
    return (
      <div
        className={`flex justify-center items-center w-full min-h-screen ${
          isDarkMode ? "bg-slate-900" : "bg-gray-50"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-slate-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Theme Toggle */}

      {/* Top Bar */}
      <header
        className={`flex justify-between items-center px-8 py-4 shadow-md sticky top-0 z-40 ${
          isDarkMode ? "bg-teal-800" : "bg-teal-600"
        } text-white`}
      >
        <Link to="/home">
          <button className="text-4xl font-extrabold tracking-tigh cursor-pointer">
            CodeVibin
          </button>
        </Link>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
            aria-label="User menu"
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
                transition={{ duration: 0.2 }}
                className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-hidden ${
                  isDarkMode
                    ? "bg-slate-800 text-gray-100"
                    : "bg-white text-gray-900"
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

      {/* Back Button */}
      <div className="flex flex-row gap-4 p-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="px-4 py-2 bg-teal-500 dark:bg-teal-700 text-white rounded-lg shadow-md transition-colors duration-200 hover:bg-teal-400 dark:hover:bg-teal-600"
          aria-label="Go back to previous page"
        >
          <GoArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Modal for Enlarged Profile Photo */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={closeModal}
            role="dialog"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-3xl w-11/12 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                aria-label="Close modal"
              >
                <X size={28} />
              </button>
              <img
                src={modalImage}
                alt="Enlarged Profile"
                className="w-full max-h-[80vh] object-contain rounded-xl"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400";
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            User Profile
          </h1>
          {user?._id === user_id && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/editprofile/${user._id}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              aria-label="Edit profile"
            >
              <Edit2 size={20} />
              Edit Profile
            </motion.button>
          )}
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`p-8 rounded-2xl shadow-lg mb-8 ${
            isDarkMode ? "bg-slate-800" : "bg-white"
          } hover:shadow-xl transition-all duration-300`}
        >
          <h2
            className="text-2xl font-bold mb-6 cursor-pointer flex justify-between items-center"
            onClick={() => toggleSection("profile")}
            aria-expanded={expanded.profile}
            aria-controls="profile-section"
          >
            Profile Info
            <span className="text-xl">{expanded.profile ? "▼" : "▶"}</span>
          </h2>
          <AnimatePresence>
            {expanded.profile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
                id="profile-section"
              >
                <div className="flex items-center mb-6">
                  {profileData.Profile_Photo ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={profileData.Profile_Photo}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 dark:border-indigo-500 mr-6 cursor-pointer shadow-sm"
                      loading="lazy"
                      onClick={() => openModal(profileData.Profile_Photo)}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/96";
                      }}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center mr-6 shadow-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        No Photo
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <p className="text-lg">
                      <strong>User Name:</strong> {profileData.UserName}{" "}
                      {profileData.Last_Name || ""}
                    </p>
                    <p className="text-lg">
                      <strong>Name:</strong> {profileData.First_Name}{" "}
                      {profileData.Last_Name || ""}
                    </p>
                    <p className="text-lg">
                      <strong>Email:</strong> {profileData.Email_Id}
                    </p>
                    <p className="text-lg">
                      <strong>Role:</strong> {profileData.Role}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dashboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`p-8 rounded-2xl shadow-lg ${
            isDarkMode ? "bg-slate-800" : "bg-white"
          } hover:shadow-xl transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-xl ${
                isDarkMode ? "bg-slate-700" : "bg-gray-100"
              } shadow-sm`}
            >
              <p className="text-3xl font-semibold text-blue-600 dark:text-indigo-400">
                {dashboardData.Total_Problems_Solved}
              </p>
              <p className="text-lg">Total Problems Solved</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-xl ${
                isDarkMode ? "bg-slate-700" : "bg-gray-100"
              } shadow-sm`}
            >
              <p className="text-3xl font-semibold text-blue-600 dark:text-indigo-400">
                {dashboardData.Total_Points}
              </p>
              <p className="text-lg">Total Points</p>
            </motion.div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Difficulty Chart */}
            <div>
              <h3
                className="text-xl font-semibold mb-4 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection("difficulty")}
                aria-expanded={expanded.difficulty}
                aria-controls="difficulty-section"
              >
                By Difficulty
                <span className="text-lg">
                  {expanded.difficulty ? "▼" : "▶"}
                </span>
              </h3>
              <AnimatePresence>
                {expanded.difficulty && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                    id="difficulty-section"
                  >
                    <div className="h-80">
                      {dashboardData.Solved_By_Difficulty.easy +
                        dashboardData.Solved_By_Difficulty.medium +
                        dashboardData.Solved_By_Difficulty.hard ===
                      0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          No problems solved yet.
                        </p>
                      ) : (
                        <Pie
                          data={difficultyChartData}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                                labels: {
                                  color: isDarkMode ? "#e5e7eb" : "#1f2937",
                                  font: { size: 14 },
                                },
                              },
                              tooltip: {
                                enabled: true,
                                backgroundColor: isDarkMode
                                  ? "#1f2937"
                                  : "#ffffff",
                                titleColor: isDarkMode ? "#e5e7eb" : "#1f2937",
                                bodyColor: isDarkMode ? "#e5e7eb" : "#1f2937",
                              },
                            },
                            animation: {
                              animateScale: true,
                              animateRotate: true,
                            },
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Topic Chart */}
            <div>
              <h3
                className="text-xl font-semibold mb-4 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection("topic")}
                aria-expanded={expanded.topic}
                aria-controls="topic-section"
              >
                By Topic
                <span className="text-lg">{expanded.topic ? "▼" : "▶"}</span>
              </h3>
              <AnimatePresence>
                {expanded.topic && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                    id="topic-section"
                  >
                    <div className="h-80">
                      {Object.keys(dashboardData.Solved_By_Topic).length ===
                      0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          No topics available.
                        </p>
                      ) : (
                        <Bar
                          data={topicChartData}
                          options={{
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  color: isDarkMode ? "#e5e7eb" : "#1f2937",
                                  font: { size: 12 },
                                },
                              },
                              x: {
                                ticks: {
                                  color: isDarkMode ? "#e5e7eb" : "#1f2937",
                                  autoSkip: false,
                                  maxRotation: 45,
                                  minRotation: 45,
                                  font: { size: 12 },
                                },
                              },
                            },
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: isDarkMode
                                  ? "#1f2937"
                                  : "#ffffff",
                                titleColor: isDarkMode ? "#e5e7eb" : "#1f2937",
                                bodyColor: isDarkMode ? "#e5e7eb" : "#1f2937",
                              },
                            },
                            animation: {
                              duration: 1000,
                              easing: "easeOutQuart",
                            },
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solved Problems */}
            <div>
              <h3
                className="text-xl font-semibold mb-4 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection("problems")}
                aria-expanded={expanded.problems}
                aria-controls="problems-section"
              >
                Solved Problems
                <span className="text-lg">{expanded.problems ? "▼" : "▶"}</span>
              </h3>
              <AnimatePresence>
                {expanded.problems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                    id="problems-section"
                  >
                    <div className="relative mb-6">
                      <Search
                        className="absolute left-4 top-3 text-gray-500 dark:text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Search problems..."
                        onChange={(e) => handleSearch(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-300"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 shadow-sm`}
                        aria-label="Search solved problems"
                      />
                    </div>
                    {filteredProblems.length > 0 ? (
                      <ol className="list-decimal pl-6 space-y-2">
                        {filteredProblems.map((title, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="py-1 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors duration-200 cursor-pointer"
                            // onClick={() => console.log(`Clicked: ${title}`)}
                          >
                            {title}
                          </motion.li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No problems match your search.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
