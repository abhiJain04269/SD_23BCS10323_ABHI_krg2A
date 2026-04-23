const Problem = require("../model/problem");
const Submissions = require("../model/Submission");
const User = require("../model/user"); // Import User model
const { getlanguageId, SubmitBatch, SubmitTokens } = require("../utils/problemutility");

const ProblemSubmit = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: true, message: "Request body is missing" });
  }

  const { Language: lan, Code: refCode, ProblemId: QuesID } = req.body;

  if (!lan || !refCode || !QuesID) {
    return res.status(400).json({ error: true, message: "Missing required fields: Language, Code, or ProblemId" });
  }

  try {
    const User_id = req.user?._id;
    if (!User_id) {
      return res.status(401).json({ error: true, message: "User not authenticated" });
    }

    const Probleminfo = await Problem.findById(QuesID);
    if (!Probleminfo) {
      return res.status(404).json({ error: true, message: "Problem not found" });
    }

    const user = await User.findById(User_id);
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    let TestPassed = 0;
    let time = 0;
    let memory = 0;
    let Error = "";
    let status_id = 0;

    const SubmissionsSave = await Submissions.create({
      Language: lan,
      Code: refCode,
      TestCasesPassed: 0,
      TotalTestCases: Probleminfo.HiddenTestCases.length,
      User: User_id,
      Status: "Pending",
      ProblemId: QuesID,
    });

    const languageId = getlanguageId(lan);
    if (!languageId) {
      return res.status(400).json({ error: true, message: "Unsupported language" });
    }

    const submissions = Probleminfo.HiddenTestCases.map((testcase) => ({
      source_code: refCode,
      language_id: languageId,
      stdin: testcase.Input,
      expected_output: testcase.Output,
    }));

    const Tokens = await SubmitBatch(submissions);
    console.log("Judge0 submission tokens:", Tokens); // Debug log
    if (!Tokens || !Array.isArray(Tokens)) {
      throw new Error("Failed to generate submission tokens");
    }

    const Result = await SubmitTokens(Tokens);
    console.log("Judge0 results:", Result); // Debug log

    for (const res of Result) {
      if (res.status_id === 3) {
        TestPassed++;
        time += parseFloat(res.time || 0);
        memory = Math.max(memory, res.memory || 0);
      }
      if (res.stderr) {
        Error = res.stderr;
      }
    }

    status_id = TestPassed === Probleminfo.HiddenTestCases.length ? 3 : Result[0]?.status_id || 4;
    const status = status_id === 3 ? "Accepted" : Result[0]?.status?.description || "Wrong Answer";

    SubmissionsSave.TestCasesPassed = TestPassed;
    SubmissionsSave.Time = time;
    SubmissionsSave.Memory = memory;
    SubmissionsSave.Status = status;
    SubmissionsSave.Error = Error;
    SubmissionsSave.status_id = status_id;
    await SubmissionsSave.save();
    console.log("Saved submission:", SubmissionsSave); // Debug log

    let pointsEarned = 0;
    if (TestPassed === Probleminfo.HiddenTestCases.length) {
      let problemEntry = user.Problem_Solved.find(
        (p) => p.problemId.toString() === QuesID
      );

      if (!problemEntry) {
        pointsEarned = problemEntry?.viewedSolution ? 0 : Probleminfo.points || 0;
        user.Problem_Solved.push({
          problemId: QuesID,
          pointsEarned,
          solvedAt: new Date(),
          viewedSolution: false,
        });
      } else if (!problemEntry.solvedAt) {
        pointsEarned = problemEntry.viewedSolution ? 0 : Probleminfo.points || 0;
        problemEntry.pointsEarned = pointsEarned;
        problemEntry.solvedAt = new Date();
      }

      user.Total_Points = user.Problem_Solved.reduce((sum, p) => sum + p.pointsEarned, 0);
      await user.save();
      console.log("Updated user Problem_Solved and Total_Points:", user.Problem_Solved, user.Total_Points);
    }
    res.json({
      submission: {
        ...SubmissionsSave.toObject(),
        pointsEarned, 
        totalPoints: user.Total_Points, 
      },
      testCaseResults: Result.map((res) => ({
        stdout: res.stdout || "",
        stderr: res.stderr || "",
        status_id: res.status_id || 0,
        status: { description: res.status?.description || "Unknown" },
        time: res.time || 0,
        memory: res.memory || 0,
      })),
    });
  } catch (err) {
    console.error("🔥 Submission error:", err.message, err.stack); 
    res.status(500).json({
      error: true,
      message: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

const ProblemRun = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: true, message: "Request body is missing" });
  }

  const { Language: lan, Code: refCode, ProblemId: QuesID } = req.body;

  if (!lan || !refCode || !QuesID) {
    return res.status(400).json({ error: true, message: "Missing required fields: Language, Code, or ProblemId" });
  }

  try {
    const Probleminfo = await Problem.findById(QuesID);
    if (!Probleminfo) {
      return res.status(404).json({ error: true, message: "Problem not found" });
    }

    const languageId = getlanguageId(lan);
    if (!languageId) {
      return res.status(400).json({ error: true, message: "Unsupported language" });
    }

    const submissions = Probleminfo.VisibleTestCases.map((testcase) => ({
      source_code: refCode,
      language_id: languageId,
      stdin: testcase.Input,
      expected_output: testcase.Output,
    }));

    const Tokens = await SubmitBatch(submissions);
    const Result = await SubmitTokens(Tokens);
    console.log("Run results:", Result); // Debug log

    res.json(
      Result.map((res) => ({
        stdout: res.stdout || "",
        stderr: res.stderr || "",
        status_id: res.status_id || 0,
        status: { description: res.status?.description || "Unknown" },
        time: res.time || 0,
        memory: res.memory || 0,
      }))
    );
  } catch (err) {
    console.error("🔥 Run error:", err.message, err.stack);
    res.status(500).json({
      error: true,
      message: "The error is: " + err.message,
    });
  }
};

module.exports = { ProblemSubmit, ProblemRun };