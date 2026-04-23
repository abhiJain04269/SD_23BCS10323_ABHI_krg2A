const  mongoose =require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  First_Name: {
    type: String,
    minLength: 2,
    maxLength: 20,
    required: true
  },
  Last_Name: {
    type: String,
    minLength: 2,
    maxLength: 20
  },
  Age: {
    type: Number,
    min: 5,
    max: 80
  },
  Role: {
    type: String,
    enum: ["user", "admin"],
    default: 'user'
  },
  Email_Id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    immutable: true
  },
  Problem_Solved: [
    {
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
      },
      pointsEarned: {
        type: Number,
        default: 0,
      },
      solvedAt: {
        type: Date,
      },
      viewedSolution: {
        type: Boolean,
        default: false,
      },
      viewedSolutionAt: {
        type: Date,
      },
    },
  ],
  Total_Points: {
    type: Number,
    default: 0 
  },
  Password: {
    type: String,
    required: true
  },
  UserName: {
    type: String,
    required: true,
    unique: true
  },
  Profile_Photo: {
    type: String,
    default: ""
  },
  Profile_Photo_PublicId: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);    
   