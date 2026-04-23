const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProblemSchema = new Schema({
  Title: {
    type: String,
    required: true,
    unique: true
  },
  Description: {
    type: String,
    required: true
  },
  TopicTag: {
    type: String,
    enum: ['Array', 'String', 'Dp', 'LinkedList', 'Graph', 'Tree', 'Binary Search', 'Sorting', 'Stack', 'Dynamic Programming', 'Two Pointers', 'Heap']
  },
  DifficultyLevel: {
    type: String,
    enum: ['basic', 'easy', 'medium', 'hard'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: function () {
      switch (this.DifficultyLevel) {
        case 'basic':
          return 5;
        case 'easy':
          return 10;
        case 'medium':
          return 20;
        case 'hard':
          return 50;
        default:
          return 10; // Fallback
      }
    }
  },
  solutionViews: {
    type: Number,
    default: 0 // Tracks number of times RefCode is viewed
  },
  Constraints: [{
    type: String,
    trim: true,
    minlength: [5, 'Constraint must be at least 5 characters long'],
    maxlength: [500, 'Constraint cannot exceed 500 characters']
  }],
  VisibleTestCases: [{
    Input: {
      type: String,
      required: true
    },
    Output: {
      type: String,
      required: true
    },
    Explanation: {
      type: String,
      required: true
    }
  }],
  HiddenTestCases: [{
    Input: {
      type: String,
      required: true
    },
    Output: {
      type: String,
      required: true
    }
  }],
  StartCode: [{
    language: {
      type: String,
      required: true
    },
    initialCode: {
      type: String,
      required: true
    }
  }],
  ProblemCreator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  RefCode: [{
    language: {
      type: String,
      required: true
    },
    CompleteCode: {
      type: String,
      required: true
    }
  }],
  Comment: [{
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const Problem = mongoose.model('Problem', ProblemSchema);

module.exports = Problem;