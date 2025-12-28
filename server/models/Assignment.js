const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: 'Difficulty must be Easy, Medium, or Hard'
    }
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  sampleTables: [{
    tableName: {
      type: String,
      required: true,
      trim: true
    },
    columns: [{
      columnName: {
        type: String,
        required: true,
        trim: true
      },
      dataType: {
        type: String,
        required: true,
        enum: ['INTEGER', 'TEXT', 'VARCHAR', 'REAL', 'DECIMAL', 'DATE', 'BOOLEAN', 'TIMESTAMP', 'NUMERIC', 'BIGINT', 'SMALLINT', 'DOUBLE PRECISION']
      }
    }],
    rows: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    }
  }],
  expectedOutput: {
    type: {
      type: String,
      required: true,
      enum: ['table', 'single_value', 'column', 'count', 'row']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  schemaName: {
    type: String,
    required: [true, 'Schema name is required for PostgreSQL isolation'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Schema name can only contain lowercase letters, numbers, and underscores']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;

