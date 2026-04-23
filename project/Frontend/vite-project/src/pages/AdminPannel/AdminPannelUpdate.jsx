import { useEffect, useState } from "react";
import axiosClient from "../../../utils/axiosClient";
import { Link } from "react-router";

const AdminPannelUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/problem/getAllProblem");
      setProblems(data.length > 0 ? data : []);
    } catch (err) {
      setError("Failed to fetch problems. Please try again later.");
      console.error("Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100 dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Admin Panel - Update Problems</h1>

      {loading && (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading problems...</div>
      )}

      {error && (
        <div className="text-red-500 dark:text-red-400 text-center mb-4" role="alert">
          {error}
        </div>
      )}

      {!loading && problems.length === 0 && !error && (
        <div className="text-center text-gray-500 dark:text-gray-400">No problems found.</div>
      )}

      <div className="space-y-4">
        {problems.map((problem) => (
          <div
            key={problem._id}
            className="bg-white dark:bg-slate-800 p-4 rounded-md shadow-md border border-gray-200 dark:border-slate-700"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-2 sm:mb-0">
                <h2
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  aria-label={`Problem Title: ${problem.Title}`}
                >
                  {problem.Title}
                </h2>
                <p
                  className="text-sm text-gray-600 dark:text-gray-300"
                  aria-label={`Topic: ${problem.TopicTag}`}
                >
                  Topic: {problem.TopicTag.toLowerCase()}
                </p>
                <p
                  className="text-sm text-gray-600 dark:text-gray-300"
                  aria-label={`Difficulty: ${problem.DifficultyLevel}`}
                >
                  Difficulty: {problem.DifficultyLevel}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium">Constraints:</p>
                  <ul className="list-disc pl-5">
                    {problem.Constraints.map((constraint, index) => (
                      <li key={index} aria-label={`Constraint ${index + 1}`}>
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link to={`/adminPannel/update/${problem._id}`}>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors mt-2 sm:mt-0"
                  aria-label={`Update problem ${problem.Title}`}
                >
                  Update
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPannelUpdate;