import { useEffect, useState } from "react";
import axiosClient from "../../../utils/axiosClient";

const AdminPannelDelete = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/problem/getAllProblem");
      setProblems(data.length > 0 ? data : []);
      setFilteredProblems(data.length > 0 ? data : []);
    } catch (err) {
      setError("Failed to fetch problems");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    console.log(id);
    setProblemToDelete(id);
    setShowConfirm(true);
  };

  const HandleDelete = async () => {
    try {
      const response = await axiosClient.delete(`/problem/Delete/${problemToDelete}`);
      if (response.status === 200) {
        setProblems(problems.filter((problem) => problem._id !== problemToDelete));
        setFilteredProblems(filteredProblems.filter((problem) => problem._id !== problemToDelete));
        setShowConfirm(false);
        setProblemToDelete(null);
      }
    } catch (err) {
      console.error("Delete error:", err.response?.data || err);
      alert(`Failed to delete problem: ${err.response?.data || err.message}`);
    }
  };

  const toggleSection = (problemId, section) => {
    setExpanded((prev) => ({
      ...prev,
      [`${problemId}-${section}`]: !prev[`${problemId}-${section}`],
    }));
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    setFilteredProblems(
      problems.filter(
        (problem) =>
          problem.Title.toLowerCase().includes(search.toLowerCase()) ||
          problem.Description.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, problems]);

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen bg-gray-100 dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Delete Problems</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search problems by title or description"
        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        aria-label="Search problems"
      />
      {loading && (
        <div className="flex justify-center my-4">
          <svg
            className="animate-spin h-8 w-8 text-indigo-500 dark:text-indigo-400"
            xmlns="http://www.w3.org/2000/svg"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      )}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      {!loading && filteredProblems.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No problems found.</p>
      )}
      {!loading && filteredProblems.length > 0 && (
        <div>
          {filteredProblems.map((problem) => (
            <div
              key={problem._id}
              className="bg-white dark:bg-slate-800 p-4 rounded-md shadow-md mb-2 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex flex-row justify-between items-center text-gray-900 dark:text-gray-100">
                <div aria-label={`Problem Title: ${problem.Title}`}>
                  {problem.Title}
                </div>
                <div aria-label={`Difficulty: ${problem.DifficultyLevel}`}>
                  {problem.DifficultyLevel}
                </div>
                <div aria-label={`Topic: ${problem.TopicTag}`}>
                  {problem.TopicTag.toLowerCase()}
                </div>
                <button
                  onClick={() => handleDeleteClick(problem._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
                  aria-label={`Delete problem ${problem.Title}`}
                >
                  Delete
                </button>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => toggleSection(problem._id, "description")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  aria-label={`Toggle description for ${problem.Title}`}
                >
                  {expanded[`${problem._id}-description`] ? "Hide" : "Show"} Description
                </button>
                {expanded[`${problem._id}-description`] && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{problem.Description}</p>
                )}
                <button
                  onClick={() => toggleSection(problem._id, "visibleTestCases")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline ml-4"
                  aria-label={`Toggle visible test cases for ${problem.Title}`}
                >
                  {expanded[`${problem._id}-visibleTestCases`] ? "Hide" : "Show"} Visible Test Cases
                </button>
                {expanded[`${problem._id}-visibleTestCases`] && (
                  <div className="mt-2 text-gray-700 dark:text-gray-300">
                    {problem.VisibleTestCases.map((tc, index) => (
                      <div key={index} className="ml-4">
                        <p>Input: {tc.Input}</p>
                        <p>Output: {tc.Output}</p>
                        <p>Explanation: {tc.Explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => toggleSection(problem._id, "startCode")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline ml-4"
                  aria-label={`Toggle starter code for ${problem.Title}`}
                >
                  {expanded[`${problem._id}-startCode`] ? "Hide" : "Show"} Starter Code
                </button>
                {expanded[`${problem._id}-startCode`] && (
                  <div className="mt-2">
                    {problem.StartCode.map((sc, index) => (
                      <div key={index} className="ml-4">
                        <p className="text-gray-700 dark:text-gray-300">Language: {sc.language}</p>
                        <pre className="bg-gray-100 dark:bg-slate-700 p-2 rounded text-gray-900 dark:text-gray-100">{sc.code}</pre>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => toggleSection(problem._id, "refCode")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline ml-4"
                  aria-label={`Toggle reference code for ${problem.Title}`}
                >
                  {expanded[`${problem._id}-refCode`] ? "Hide" : "Show"} Reference Code
                </button>
                {expanded[`${problem._id}-refCode`] && (
                  <div className="mt-2">
                    {problem.RefCode.map((rc, index) => (
                      <div key={index} className="ml-4">
                        <p className="text-gray-700 dark:text-gray-300">Language: {rc.language}</p>
                        <pre className="bg-gray-100 dark:bg-slate-700 p-2 rounded text-gray-900 dark:text-gray-100">{rc.code}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Delete</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete this problem?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-slate-600 rounded-md hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={HandleDelete}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPannelDelete;