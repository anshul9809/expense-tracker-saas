const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  activityType: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure']
  },
  errorMessage: {
    type: String
  },
  statusCode: {
    type: Number
  },
  requestData: {
    type: String
  },
  responseData: {
    type: String
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Expense', 'Income']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
