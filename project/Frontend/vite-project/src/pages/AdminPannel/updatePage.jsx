
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axiosClient from "../../../utils/axiosClient";

const UpdatePage = () => {
  const Problemid = useParams(); // Correctly extract id from route
  const id=Problemid.problemid;
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "",
    tags: "",
    visibleTestCases: [{ Input: "", Output: "", Explanation: "" }],
    hiddenTestCases: [{ Input: "", Output: "" }],
    startCode: [
      { language: "cpp", code: "" },
      { language: "java", code: "" },
      { language: "python", code: "" },
    ],
    refCode: [
      { language: "cpp", code: "" },
      { language: "java", code: "" },
      { language: "python", code: "" },
    ],
    constraints:[{
      minlength:[""],
      maxlength:[""]
    }]
  });

  useEffect(() => {
    console.log("Route ID:", id); // Debug: Log the id
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get(`/problem/problemById/${id}`);
        console.log("Fetched problem:", data); // Debug: Log fetched data
        setProblem(data);
        setFormData({
          title: data.Title || "",
          description: data.Description || "",
          difficulty: data.DifficultyLevel || "easy",
          tags: data.TopicTag || "Array",
          visibleTestCases: data.VisibleTestCases.length > 0
            ? data.VisibleTestCases.map((tc) => ({
                Input: tc.Input,
                Output: tc.Output,
                Explanation: tc.Explanation,
              }))
            : [{ Input: "", Output: "", Explanation: "" }],
          hiddenTestCases: data.HiddenTestCases.length > 0
            ? data.HiddenTestCases.map((tc) => ({
                Input: tc.Input,
                Output: tc.Output,
              }))
            : [{ Input: "", Output: "" }],
          startCode: data.StartCode.length === 3
            ? data.StartCode.map((sc) => ({
                language: sc.language.toLowerCase(),
                code: sc.initialCode || "",
              }))
            : [
                { language: "cpp", code: "" },
                { language: "java", code: "" },
                { language: "python", code: "" },
              ],
          constraints:data.Constraints||"",
          refCode: data.RefCode.length === 3
            ? data.RefCode.map((rc) => ({
                language: rc.language.toLowerCase(),
                code: rc.CompleteCode || "",
              }))
            : [
                { language: "cpp", code: "" },
                { language: "java", code: "" },
                { language: "python", code: "" },
              ],
        });
      } catch (err) {
        setError("Failed to fetch problem");
        console.error("Fetch error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleChange = (e, index, field, arrayName) => {
    if (arrayName) {
      const updatedArray = [...formData[arrayName]];
      updatedArray[index] = { ...updatedArray[index], [field]: e.target.value };
      setFormData({ ...formData, [arrayName]: updatedArray });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const addTestCase = (type) => {
    if (type === "visible") {
      setFormData({
        ...formData,
        visibleTestCases: [...formData.visibleTestCases, { Input: "", Output: "", Explanation: "" }],
      });
    } else {
      setFormData({
        ...formData,
        hiddenTestCases: [...formData.hiddenTestCases, { Input: "", Output: "" }],
      });
    }
  };

  const removeTestCase = (type, index) => {
    if (type === "visible") {
      setFormData({
        ...formData,
        visibleTestCases: formData.visibleTestCases.filter((_, i) => i !== index),
      });
    } else {
      setFormData({
        ...formData,
        hiddenTestCases: formData.hiddenTestCases.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!formData.title) throw new Error("Title is required");
      if (!formData.description) throw new Error("Description is required");
      if (!["basic", "easy", "medium", "hard"].includes(formData.difficulty))
        throw new Error("Invalid difficulty level");
      if (!["Array", "String", "Dp", "LinkedList", "Graph", "Tree", "Binary Search", "Sorting"].includes(formData.tags))
        throw new Error("Invalid topic tag");
      if (formData.visibleTestCases.length === 0)
        throw new Error("At least one visible test case is required");
      if (formData.hiddenTestCases.length === 0)
        throw new Error("At least one hidden test case is required");
      formData.visibleTestCases.forEach((tc, i) => {
        if (!tc.Input) throw new Error(`Visible test case ${i + 1} input is required`);
        if (!tc.Output) throw new Error(`Visible test case ${i + 1} output is required`);
        if (!tc.Explanation) throw new Error(`Visible test case ${i + 1} explanation is required`);
      });
      formData.hiddenTestCases.forEach((tc, i) => {
        if (!tc.Input) throw new Error(`Hidden test case ${i + 1} input is required`);
        if (!tc.Output) throw new Error(`Hidden test case ${i + 1} output is required`);
      });
      formData.startCode.forEach((sc, i) => {
        if (!sc.code) throw new Error(`Starter code for ${sc.language} is required`);
        if (!["cpp", "java", "python"].includes(sc.language))
          throw new Error(`Invalid language for starter code ${i + 1}`);
      });
      formData.refCode.forEach((rc, i) => {
        if (!rc.code) throw new Error(`Reference code for ${rc.language} is required`);
        if (!["cpp", "java", "python"].includes(rc.language))
          throw new Error(`Invalid language for reference code ${i + 1}`);
      });

      // Validate input format for "Sum of Two Integers"
      const validateInputFormat = (input, title) => {
        if (title === "Sum of Two Integers" && !input.match(/^\d+\s+\d+$/)) {
          throw new Error("Sum of Two Integers test cases should use space-separated numbers (e.g., '1 2')");
        }
        return true;
      };
      formData.visibleTestCases.forEach((tc) => validateInputFormat(tc.Input, formData.title));
      formData.hiddenTestCases.forEach((tc) => validateInputFormat(tc.Input, formData.title));

      const payload = {
        Title: formData.title,
        Description: formData.description,
        DifficultyLevel: formData.difficulty,
        TopicTag: formData.tags,
        VisibleTestCases: formData.visibleTestCases,
        HiddenTestCases: formData.hiddenTestCases,
        StartCode: formData.startCode.map((sc) => ({
          language: sc.language,
          initialCode: sc.code,
          language_id: sc.language === "cpp" ? 54 : sc.language === "java" ? 62 : 71,
        })),
        RefCode: formData.refCode.map((rc) => ({
          language: rc.language,
          CompleteCode: rc.code,
          language_id: rc.language === "cpp" ? 54 : rc.language === "java" ? 62 : 71,
        })),
        Constraints:formData.constraints
      };
      console.log(payload);
      const response = await axiosClient.put(`/problem/Update/${id}`, payload);
      console.log("API Response:", response.data); // Debug: Log API response
      alert("Problem updated successfully!");
      navigate("/adminPannel/update");
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-4">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
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
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">
        {error}
      </div>
    );
  }

  if (!problem) {
    return <div className="text-center text-gray-500">Problem not found</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Problem</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/adminPannel/update")}
          className="bg-gray-300 text-black px-3 py-1 rounded-md mb-4"
          aria-label="Back to Problem List"
        >
          Back to Problem List
        </button>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Problem Title"
          className="w-full p-3 border rounded"
          aria-label="Problem Title"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Problem Description"
          className="w-full p-3 border rounded"
          aria-label="Problem Description"
        />
        <textarea
          name="constraints"
          value={formData.constraints}
          onChange={handleChange}
          placeholder="Problem Constraints"
          className="w-full p-3 border rounded"
          aria-label="Problem Constraints"
        />
        <div className="flex space-x-4">
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="p-2 border rounded"
            aria-label="Difficulty Level"
          >
            <option value="basic">Basic</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="p-2 border rounded"
            aria-label="Topic Tag"
          >
            <option value="Array">Array</option>
            <option value="String">String</option>
            <option value="Dp">Dynamic Programming</option>
            <option value="LinkedList">Linked List</option>
            <option value="Graph">Graph</option>
            <option value="Tree">Tree</option>
            <option value="Binary Search">Binary Search</option>
            <option value="Sorting">Sorting</option>
          </select>
        </div>
        <h2 className="font-semibold">Visible Test Cases</h2>
        {formData.visibleTestCases.map((tc, index) => (
          <div key={index} className="border p-3 space-y-2 mb-2">
            <input
              value={tc.Input}
              onChange={(e) => handleChange(e, index, "Input", "visibleTestCases")}
              placeholder="Input"
              className="w-full border p-2"
              aria-label={`Visible Test Case ${index + 1} Input`}
            />
            <input
              value={tc.Output}
              onChange={(e) => handleChange(e, index, "Output", "visibleTestCases")}
              placeholder="Output"
              className="w-full border p-2"
              aria-label={`Visible Test Case ${index + 1} Output`}
            />
            <input
              value={tc.Explanation}
              onChange={(e) => handleChange(e, index, "Explanation", "visibleTestCases")}
              placeholder="Explanation"
              className="w-full border p-2"
              aria-label={`Visible Test Case ${index + 1} Explanation`}
            />
            <button
              type="button"
              onClick={() => removeTestCase("visible", index)}
              className="text-red-600"
              aria-label={`Remove Visible Test Case ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addTestCase("visible")}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          aria-label="Add Visible Test Case"
        >
          Add Visible Test Case
        </button>
        <h2 className="font-semibold">Hidden Test Cases</h2>
        {formData.hiddenTestCases.map((tc, index) => (
          <div key={index} className="border p-3 space-y-2 mb-2">
            <input
              value={tc.Input}
              onChange={(e) => handleChange(e, index, "Input", "hiddenTestCases")}
              placeholder="Input"
              className="w-full border p-2"
              aria-label={`Hidden Test Case ${index + 1} Input`}
            />
            <input
              value={tc.Output}
              onChange={(e) => handleChange(e, index, "Output", "hiddenTestCases")}
              placeholder="Output"
              className="w-full border p-2"
              aria-label={`Hidden Test Case ${index + 1} Output`}
            />
            <button
              type="button"
              onClick={() => removeTestCase("hidden", index)}
              className="text-red-600"
              aria-label={`Remove Hidden Test Case ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addTestCase("hidden")}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          aria-label="Add Hidden Test Case"
        >
          Add Hidden Test Case
        </button>
        <h2 className="font-semibold">Starter Code</h2>
        {formData.startCode.map((sc, index) => (
          <div key={index} className="border p-3 mb-2">
            <label className="block font-medium">{sc.language.toUpperCase()}</label>
            <textarea
              value={sc.code}
              onChange={(e) => handleChange(e, index, "code", "startCode")}
              placeholder={`Starter code for ${sc.language}`}
              className="w-full p-2 border rounded font-mono"
              rows="5"
              aria-label={`Starter Code for ${sc.language}`}
            />
          </div>
        ))}
        <h2 className="font-semibold">Reference Solutions</h2>
        {formData.refCode.map((rc, index) => (
          <div key={index} className="border p-3 mb-2">
            <label className="block font-medium">{rc.language.toUpperCase()}</label>
            <textarea
              value={rc.code}
              onChange={(e) => handleChange(e, index, "code", "refCode")}
              placeholder={`Reference solution for ${rc.language}`}
              className="w-full p-2 border rounded font-mono"
              rows="5"
              aria-label={`Reference Solution for ${rc.language}`}
            />
          </div>
        ))}
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded"
          aria-label="Update Problem"
        >
          Update Problem
        </button>
      </form>
    </div>
  );
};

export default UpdatePage;
