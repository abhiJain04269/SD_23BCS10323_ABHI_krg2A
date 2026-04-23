const express=require('express');
const router = express.Router();
const token_validate=require("../middleware/user_Middleware");

const {ProblemSubmit,ProblemRun}=require("../controllers/ProblemSubmit");

router.post("/submit",token_validate,ProblemSubmit);
router.post("/run",token_validate,ProblemRun);

module.exports=router;