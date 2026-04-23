const express = require('express');
const router = express.Router();
const AdminMiddleware = require("../middleware/adminMiddleware");
const token_validate = require("../middleware/user_Middleware");
const {
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
} = require("../controllers/problemCreate");


router.post("/Create", AdminMiddleware, CreateProblem);
router.put("/Update/:id", AdminMiddleware, UpdateProblem);
router.delete("/Delete/:id", AdminMiddleware, DeleteProblem);
router.get("/problemById/:id", FindProblem);
router.get("/getAllProblem", FindAllProblem);
router.get("/problemSolvedByUser", token_validate, FetchAllSolvedProblems);
router.get("/problemSubmittedByUser/:pid", token_validate, SubmittedProblem);
router.post("/SaveComment/:pid", token_validate, SaveComment);
router.post("/DeleteComment/:pid/:commentid", token_validate, DeleteComment);
router.get("/getAllComments/:pid", token_validate, GetAllComments);
router.post("/view-solution/:pid", token_validate, ViewSolution); 

module.exports = router;