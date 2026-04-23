const { getlanguageId, SubmitBatch, SubmitTokens } = require("../utils/problemutility");
const Problem = require("../model/problem");
const User = require("../model/user");
const Submissions = require("../model/Submission");
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');


const CreateProblem = async (req, res) => {
  try {
    const {
      Title,
      Description,
      TopicTag,
      DifficultyLevel,
      Constraints,
      VisibleTestCases,
      HiddenTestCases,
      StartCode,
      RefCode,
    } = req.body;

    if (!Title || !Description || !TopicTag || !DifficultyLevel || !Constraints || !RefCode || !VisibleTestCases || !HiddenTestCases) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const allTestCases = [...VisibleTestCases, ...HiddenTestCases];

    for (const { language, CompleteCode } of RefCode) {
      const languageId = getlanguageId(language);
      if (!languageId) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
      }

      const submissions = allTestCases.map((testcase, index) => ({
        source_code: CompleteCode,
        language_id: languageId,
        stdin: testcase.Input,
        expected_output: testcase.Output.trim() + '\n',
        testcase_index: index,
        testcase_type: index < VisibleTestCases.length ? 'visible' : 'hidden',
      }));

      console.log(`Submitting to Judge0 for ${language}:`, submissions);

      let tokens;
      try {
        tokens = await SubmitBatch(submissions);
        console.log(`Judge0 submission tokens for ${language}:`, tokens);
      } catch (judgeError) {
        console.error(`Judge0 submission error for ${language}:`, judgeError.response?.data || judgeError.message);
        return res.status(500).json({ error: `Failed to submit code for ${language}`, details: judgeError.message });
      }

      if (!tokens || !Array.isArray(tokens)) {
        return res.status(500).json({ error: `Invalid response from Judge0 for ${language}: tokens is not an array` });
      }

      let results;
      try {
        results = await SubmitTokens(tokens);
        console.log(`Judge0 results for ${language}:`, results);
      } catch (judgeError) {
        console.error(`Judge0 token polling error for ${language}:`, judgeError.response?.data || judgeError.message);
        return res.status(500).json({ error: `Failed to retrieve results for ${language}`, details: judgeError.message });
      }

      if (!Array.isArray(results)) {
        return res.status(500).json({ error: `Invalid results format from Judge0 for ${language}: results is not an array` });
      }

      for (const [index, result] of results.entries()) {
        if (!result) {
          return res.status(500).json({
            error: `No result returned for ${submissions[index].testcase_type} test case ${submissions[index].testcase_index + 1} in ${language}`,
          });
        }
        if (result.status_id > 3) {
          return res.status(400).json({
            error: `Validation failed for ${language} on ${submissions[index].testcase_type} test case ${submissions[index].testcase_index + 1}`,
            details: result.status?.description || "Unknown error",
            stderr: result.stderr || "No error output",
            compile_output: result.compile_output || "No compilation output",
          });
        }
        if (result.stdout?.trim() !== submissions[index].expected_output.trim()) {
          return res.status(400).json({
            error: `Output mismatch for ${language} on ${submissions[index].testcase_type} test case ${submissions[index].testcase_index + 1}`,
            details: {
              stdout: result.stdout || "No output",
              expected_output: submissions[index].expected_output,
            },
          });
        }
      }
    }

    try {
      const created = await Problem.create({
        Title,
        Description,
        TopicTag,
        DifficultyLevel,
        Constraints,
        VisibleTestCases,
        HiddenTestCases,
        StartCode,
        RefCode,
        ProblemCreator: req.user._id,
      });
      return res.status(201).json({
        message: "Problem created successfully",
        problemId: created._id,
      });
    } catch (dbError) {
      console.error("Database storage error:", dbError);
      return res.status(500).json({ error: "Failed to store problem in database", details: dbError.message });
    }
  } catch (error) {
    console.error("Unexpected error in CreateProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const UpdateProblem = async (req, res) => {
  console.log("hi");
  const Id = req.params.id;

  if (!Id) {
    return res.status(400).json({ error: "Problem ID is required" });
  }

  const {
    Title,
    Description,
    TopicTag,
    DifficultyLevel,
    Constraints,
    VisibleTestCases,
    HiddenTestCases,
    StartCode,
    RefCode,
  } = req.body;

  if (!Title || !Description || !TopicTag || !DifficultyLevel || !Constraints || !RefCode || !VisibleTestCases || !HiddenTestCases) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    for (const { language, CompleteCode } of RefCode) {
      const languageId = getlanguageId(language);
      if (!languageId) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
      }

      const allTestCases = [...VisibleTestCases, ...HiddenTestCases];
      const submissions = allTestCases.map((testcase, index) => ({
        source_code: CompleteCode,
        language_id: languageId,
        stdin: testcase.Input,
        expected_output: testcase.Output.trim() + '\n',
        testcase_index: index,
        testcase_type: index < VisibleTestCases.length ? 'visible' : 'hidden',
      }));

      const tokens = await SubmitBatch(submissions);

      const results = await SubmitTokens(tokens);
      for (const [index, result] of results.entries()) {
        if (result.status_id > 3) {
          return res.status(400).json({
            error: `Validation failed for ${language} on ${submissions[index].testcase_type} test case ${submissions[index].testcase_index + 1}`,
            details: result.status?.description || "Unknown error",
          });
        }
        if (result.stdout?.trim() !== submissions[index].expected_output.trim()) {
          return res.status(400).json({
            error: `Output mismatch for ${language} on ${submissions[index].testcase_type} test case ${submissions[index].testcase_index + 1}`,
            details: {
              stdout: result.stdout || "No output",
              expected_output: submissions[index].expected_output,
            },
          });
        }
      }
    }

    const newProblem = await Problem.findByIdAndUpdate(
      Id,
      {
        Title,
        Description,
        TopicTag,
        DifficultyLevel,
        Constraints,
        VisibleTestCases,
        HiddenTestCases,
        StartCode,
        RefCode,
      },
      { runValidators: true, new: true }
    );

    if (!newProblem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(newProblem);
  } catch (error) {
    console.error("Error in UpdateProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const DeleteProblem = async (req, res) => {
  const Id = req.params.id;

  if (!Id) {
    return res.status(400).json({ error: "Problem ID is required" });
  }

  try {
    const isDeleted = await Problem.findByIdAndDelete(Id);
    if (isDeleted) {
      return res.json({ message: "The Problem is Deleted" });
    } else {
      return res.status(404).json({ error: "Problem not found" });
    }
  } catch (error) {
    console.error("Error in DeleteProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const FindProblem = async (req, res) => {
  const Id = req.params.id;

  if (!Id) {
    return res.status(400).json({ error: "Problem ID is required" });
  }

  try {
    const problemFind = await Problem.findById(Id);
    if (problemFind) {
      res.json(problemFind);
    } else {
      return res.status(404).json({ error: "Problem not found" });
    }
  } catch (error) {
    console.error("Error in FindProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const FindAllProblem = async (req, res) => {
  try {
    const problemsFind = await Problem.find({});
    if (problemsFind.length > 0) {
      res.json(problemsFind);
    } else {
      return res.status(404).json({ error: "No problems found" });
    }
  } catch (error) {
    console.error("Error in FindAllProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const FetchAllSolvedProblems = async (req, res) => {
  try {
    const user_id = req.user._id;

    const user = await User.findById(user_id).populate({
      path: "Problem_Solved.problemId",
      select: "_id Title Description DifficultyLevel TopicTag", // Add Description to select
    });

    res.json(user.Problem_Solved);
  } catch (error) {
    console.error("Error in FetchAllSolvedProblems:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const SubmittedProblem = async (req, res) => {
  try {
    const user = req.user._id;
    const problemId = req.params.pid;
    console.log(user, problemId);
    const submissions = await Submissions.find({ User: user, ProblemId: problemId });
    console.log(submissions);
    if (submissions.length === 0) {
      return res.status(200).json({ message: "No submissions found" });
    }
    res.json(submissions);
  } catch (error) {
    console.error("Error in SubmittedProblem:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const SaveComment = async (req, res) => {
    try {
        const userId = req.user._id;
        const problemId = req.params.pid;
        const { comment } = req.body;

        // Validate input
        if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required and must be a non-empty string' });
        }

        // Find the problem
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Add the comment
        const newComment = {
            user_id: userId,
            comment: comment,
            createdAt: new Date(),
        };
        problem.Comment.push(newComment);

        await problem.save();

        // Fetch the updated comments with populated user data
        const updatedProblem = await Problem.findById(problemId)
            .select('Comment')
            .populate('Comment.user_id', 'First_Name Email_Id UserName');

        // Emit Socket.IO event to all clients in the problem room
        const io = req.app.get('io');
        io.to(problemId).emit('newComment', updatedProblem.Comment);

        return res.status(200).json({
            success: true,
            message: 'Comment saved successfully',
            comments: updatedProblem.Comment
        });
    } catch (error) {
        console.error('Error saving comment:', error);
        return res.status(500).json({ error: 'Server error while saving comment' });
    }
};

const DeleteComment = async (req, res) => {
    const { pid, commentid } = req.params;
    const userId = req.user._id;
    try {
        const problem = await Problem.findById(pid);
        if (!problem) {
            return res.status(400).json({ message: "Question Not Exist" });
        }

        const comment = problem.Comment.id(commentid);
        if (!comment) {
            return res.status(400).json({ message: "Comment Not Exist" });
        }

        // Check if the user is authorized to delete the comment
        if (comment.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        problem.Comment.pull(commentid);
        await problem.save();

        // Fetch the updated comments with populated user data
        const updatedProblem = await Problem.findById(pid)
            .select('Comment')
            .populate('Comment.user_id', 'First_Name Email_Id UserName');

        // Emit Socket.IO event to all clients in the problem room
        const io = req.app.get('io');
        io.to(pid).emit('commentDeleted', { commentId: commentid, comments: updatedProblem.Comment });

        return res.json({ success: true, message: 'Comment deleted successfully', comments: updatedProblem.Comment });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Server error while deleting comment' });
    }
};
const GetAllComments = async (req, res) => {
  try {
    const { pid } = req.params; // Fixed destructuring
    const userId = req.user._id; // From token_validate middleware
    console.log("hello"+userId);

    const problem = await Problem.findById(pid)
      .select('Comment')
      .populate('Comment.user_id', 'First_Name Email_Id UserName'); // Adjust fields as per User schema
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    console.log(`Fetched comments for problem ${pid} by user ${userId}`);
    return res.json({ success: true, comments: problem.Comment });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Server error while fetching comments' });
  }
};

const ViewSolution = async (req, res) => {
  const requestId = uuidv4();
  console.log(`ViewSolution requestId: ${requestId}, Body:`, req.body, `Params:`, req.params);

  const { pid } = req.params;
  const userId = req.user?._id;

  if (!userId || !pid) {
    return res.status(400).json({ error: true, message: "Missing user ID or problem ID", requestId });
  }

  if (!mongoose.Types.ObjectId.isValid(pid)) {
    return res.status(400).json({ error: true, message: "Invalid problem ID format", requestId });
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      const problem = await Problem.findById(pid).session(session);

      if (!user || !problem) {
        await session.abortTransaction();
        return res.status(404).json({ error: true, message: "User or problem not found", requestId });
      }

      console.log(`User ${userId} Problem_Solved before update [requestId: ${requestId}]:`, user.Problem_Solved);

      let problemEntry = user.Problem_Solved.find(
        (p) => p?.problemId?.toString() === pid
      );

      if (!problemEntry) {
        user.Problem_Solved.push({
          problemId: new mongoose.Types.ObjectId(pid),
          pointsEarned: 0,
          viewedSolution: true,
          viewedSolutionAt: new Date(),
        });
      } else {
        problemEntry.viewedSolution = true;
        problemEntry.viewedSolutionAt = new Date();
      }

      console.log(`User ${userId} Problem_Solved after update [requestId: ${requestId}]:`, user.Problem_Solved);
      await user.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: "Solution view recorded", requestId });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`🔥 View solution error [requestId: ${requestId}]:`, err.message, err.stack);
    res.status(500).json({
      error: true,
      message: err.message || "Internal Server Error",
      requestId,
    });
  }
};
module.exports = {
  CreateProblem,
  UpdateProblem,
  DeleteProblem,
  FindProblem,
  FindAllProblem,
  FetchAllSolvedProblems,
  SubmittedProblem,
  SaveComment,
  DeleteComment,
  GetAllComments,
  ViewSolution
};