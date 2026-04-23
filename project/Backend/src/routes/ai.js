const express=require('express');
const aiRouter = express.Router();
const token_validate=require('../middleware/user_Middleware')
const solveDoubt=require("../controllers/solveDoubt");

aiRouter.post("/solveDoubt",token_validate,solveDoubt);

module.exports=aiRouter;