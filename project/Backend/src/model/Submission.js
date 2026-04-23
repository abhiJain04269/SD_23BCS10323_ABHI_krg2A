const  mongoose =require('mongoose');
const { Schema } = mongoose;

const SubmissionSchema=new Schema({
    Language:{
        type:String,
        required:true
    },
    Code:{
        type:String,
        required:true
    },
    TestCasesPassed:{
        type:Number,
        required:true,
        default:0
    },
    TotalTestCases:{
        type:Number,
        required:true
    },
    Time:{
        type:Number,
        default:0
    },
    Memory:{
        type:Number,
        default:0
    },
    User:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    Status:{
        type:String,
        required:true
    },
    Error:{
        type:String,
        default: null
    },
    ProblemId:{
        type: Schema.Types.ObjectId,
        ref:'Problem',
        required:true
    }
},{timestamps:true});

const Submissions=mongoose.model('Submissions',SubmissionSchema);
module.exports=Submissions;