import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { logoutUser } from "../../../utils/Slice/authSlice";
import axiosClient from "../../../utils/axiosClient";

// Zod Schemas
const testCaseSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  explanation: z.string().min(1, "Explanation is required"),
});

const hiddenTestCaseSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
});

const codeSchema = z.object({
  language: z.enum(["Cpp", "Java", "Python"]),
  initialCode: z.string().min(1, "Initial code is required"),
});

const referenceCodeSchema = z.object({
  language: z.enum(["Cpp", "Java", "Python"]),
  completeCode: z.string().min(1, "Reference solution is required"),
});

const constraintSchema = z
  .string()
  .min(5, "Constraint must be at least 5 characters long")
  .max(500, "Constraint cannot exceed 500 characters")
  .trim();

const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({ message: "Please select a difficulty level" }),
  }),
  tags: z.enum(["Array", "String", "LinkedList", "Graph", "Dp"], {
    errorMap: () => ({ message: "Please select a tag" }),
  }),
  constraints: z
    .array(constraintSchema)
    .min(1, "At least one constraint is required"),
  visibleTestCases: z
    .array(testCaseSchema)
    .min(1, "At least one visible test case is required"),
  hiddenTestCases: z
    .array(hiddenTestCaseSchema)
    .min(1, "At least one hidden test case is required"),
  startCode: z
    .array(codeSchema)
    .length(3, "All three starter code languages are required")
    .refine(
      (items) => new Set(items.map((item) => item.language)).size === 3,
      { message: "Each starter code language must be unique (Cpp, Java, Python)" }
    ),
  referenceSolution: z
    .array(referenceCodeSchema)
    .length(3, "All three reference solution languages are required")
    .refine(
      (items) => new Set(items.map((item) => item.language)).size === 3,
      { message: "Each reference solution language must be unique (Cpp, Java, Python)" }
    ),
});

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [backendError, setBackendError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      tags: "Array",
      constraints: [""],
      visibleTestCases: [{ input: "", output: "", explanation: "" }],
      hiddenTestCases: [{ input: "", output: "" }],
      startCode: [
        { language: "Cpp", initialCode: "" },
        { language: "Java", initialCode: "" },
        { language: "Python", initialCode: "" },
      ],
      referenceSolution: [
        { language: "Cpp", completeCode: "" },
        { language: "Java", completeCode: "" },
        { language: "Python", completeCode: "" },
      ],
    },
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({ control, name: "visibleTestCases" });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({ control, name: "hiddenTestCases" });

  const {
    fields: constraintFields,
    append: appendConstraint,
    remove: removeConstraint,
  } = useFieldArray({ control, name: "constraints" });

  const {
    fields: starterFields,
    append: appendStarter,
    remove: removeStarter,
  } = useFieldArray({ control, name: "startCode" });

  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({ control, name: "referenceSolution" });

  const handleLogout = () => dispatch(logoutUser());

  const onSubmit = async (data) => {
    try {
      setBackendError(null);
      setSuccessMessage(null);

      const payload = {
        Title: data.title,
        Description: data.description,
        TopicTag: data.tags,
        DifficultyLevel: data.difficulty,
        Constraints: data.constraints,
        VisibleTestCases: data.visibleTestCases.map((tc) => ({
          Input: tc.input,
          Output: tc.output,
          Explanation: tc.explanation,
        })),
        HiddenTestCases: data.hiddenTestCases.map((tc) => ({
          Input: tc.input,
          Output: tc.output,
        })),
        StartCode: data.startCode.map((sc) => ({
          language: sc.language,
          initialCode: sc.initialCode,
        })),
        ProblemCreator: user._id,
        RefCode: data.referenceSolution.map((rc) => ({
          language: rc.language,
          CompleteCode: rc.completeCode,
        })),
      };

      const response = await axiosClient.post("/problem/Create", payload);
      setSuccessMessage(response.data.message || "Problem created successfully!");
      reset();
    } catch (error) {
      const errorDetails = error.response?.data?.details
        ? JSON.stringify(error.response.data.details, null, 2)
        : error.response?.data?.error || "Failed to create problem";
      setBackendError(errorDetails);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user?.First_Name || "Admin"}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
          {successMessage}
        </div>
      )}
      {backendError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          <pre>{backendError}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Problem Title
          </label>
          <input
            {...register("title")}
            placeholder="Enter problem title"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          />
          {errors.title && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Problem Description
          </label>
          <textarea
            {...register("description")}
            placeholder="Enter problem description"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            rows={5}
          />
          {errors.description && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Difficulty and Tags */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Difficulty
            </label>
            <select
              {...register("difficulty")}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {errors.difficulty && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.difficulty.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <select
              {...register("tags")}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            >
              <option value="Array">Array</option>
              <option value="String">String</option>
              <option value="LinkedList">Linked List</option>
              <option value="Graph">Graph</option>
              <option value="Dp">Dynamic Programming</option>
            </select>
            {errors.tags && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.tags.message}</p>
            )}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Constraints
          </h2>
          {errors.constraints && !errors.constraints?.[0] && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.constraints.message}
            </p>
          )}
          {constraintFields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded bg-white dark:bg-gray-700 shadow-sm mb-2 space-y-2 dark:border-gray-600"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Constraint {index + 1}
                </label>
                <textarea
                  {...register(`constraints.${index}`)}
                  placeholder="Enter constraint description"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                  rows={3}
                />
                {errors.constraints?.[index] && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.constraints[index].message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeConstraint(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
              >
                Remove Constraint
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendConstraint("")}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition mt-2"
          >
            Add Constraint
          </button>
        </div>

        {/* Visible Test Cases */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Visible Test Cases
          </h2>
          {errors.visibleTestCases && !errors.visibleTestCases?.[0] && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.visibleTestCases.message}
            </p>
          )}
          {visibleFields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded bg-white dark:bg-gray-700 shadow-sm mb-2 space-y-2 dark:border-gray-600"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Input
                </label>
                <input
                  {...register(`visibleTestCases.${index}.input`)}
                  placeholder="Test case input"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                />
                {errors.visibleTestCases?.[index]?.input && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.visibleTestCases[index].input.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output
                </label>
                <input
                  {...register(`visibleTestCases.${index}.output`)}
                  placeholder="Expected output"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                />
                {errors.visibleTestCases?.[index]?.output && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.visibleTestCases[index].output.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Explanation
                </label>
                <input
                  {...register(`visibleTestCases.${index}.explanation`)}
                  placeholder="Explanation"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                />
                {errors.visibleTestCases?.[index]?.explanation && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.visibleTestCases[index].explanation.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeVisible(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
              >
                Remove Test Case
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendVisible({ input: "", output: "", explanation: "" })}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition mt-2"
          >
            Add Visible Test Case
          </button>
        </div>

        {/* Hidden Test Cases */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Hidden Test Cases
          </h2>
          {errors.hiddenTestCases && !errors.hiddenTestCases?.[0] && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.hiddenTestCases.message}
            </p>
          )}
          {hiddenFields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded bg-white dark:bg-gray-700 shadow-sm mb-2 space-y-2 dark:border-gray-600"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Input
                </label>
                <input
                  {...register(`hiddenTestCases.${index}.input`)}
                  placeholder="Test case input"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                />
                {errors.hiddenTestCases?.[index]?.input && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.hiddenTestCases[index].input.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output
                </label>
                <input
                  {...register(`hiddenTestCases.${index}.output`)}
                  placeholder="Expected output"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                />
                {errors.hiddenTestCases?.[index]?.output && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.hiddenTestCases[index].output.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeHidden(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
              >
                Remove Test Case
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendHidden({ input: "", output: "" })}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition mt-2"
          >
            Add Hidden Test Case
          </button>
        </div>

        {/* Starter Code */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Starter Code
          </h2>
          {errors.startCode && !errors.startCode?.[0] && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.startCode.message}</p>
          )}
          {starterFields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded bg-white dark:bg-gray-700 shadow-sm mb-2 space-y-2 dark:border-gray-600"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <select
                  {...register(`startCode.${index}.language`)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                >
                  <option value="Cpp">C++</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                </select>
                {errors.startCode?.[index]?.language && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.startCode[index].language.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Initial Code
                </label>
                <textarea
                  {...register(`startCode.${index}.initialCode`)}
                  placeholder="Enter starter code"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                  rows={5}
                />
                {errors.startCode?.[index]?.initialCode && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.startCode[index].initialCode.message}
                  </p>
                )}
              </div>
              {starterFields.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeStarter(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                >
                  Remove Starter Code
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendStarter({ language: "Cpp", initialCode: "" })}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition mt-2"
          >
            Add Starter Code
          </button>
        </div>

        {/* Reference Solutions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Reference Solutions
          </h2>
          {errors.referenceSolution && !errors.referenceSolution?.[0] && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.referenceSolution.message}
            </p>
          )}
          {referenceFields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded bg-white dark:bg-gray-700 shadow-sm mb-2 space-y-2 dark:border-gray-600"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <select
                  {...register(`referenceSolution.${index}.language`)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                >
                  <option value="Cpp">C++</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                </select>
                {errors.referenceSolution?.[index]?.language && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.referenceSolution[index].language.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference Solution
                </label>
                <textarea
                  {...register(`referenceSolution.${index}.completeCode`)}
                  placeholder="Enter reference solution code"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                  rows={5}
                />
                {errors.referenceSolution?.[index]?.completeCode && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.referenceSolution[index].completeCode.message}
                  </p>
                )}
              </div>
              {referenceFields.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeReference(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                >
                  Remove Reference Solution
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendReference({ language: "Cpp", completeCode: "" })}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition mt-2"
          >
            Add Reference Solution
          </button>
        </div>

        <button
          type="submit"
          className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded hover:bg-green-700 dark:hover:bg-green-800 transition"
        >
          Submit Problem
        </button>
      </form>
    </div>
  );
};

export default AdminPanel;