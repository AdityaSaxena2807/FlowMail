const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['coldEmail', 'wait', 'leadSource'],
  },
  position: {
    x: Number,
    y: Number,
  },
  data: {
    label: String,
    delay: String, // for wait nodes: "1h", "30m", etc.
    email: {
      subject: String,
      body: String,
      to: String, // optional, can be determined at runtime
    },
    leadSource: String, // for leadSource nodes
  },
});

const EdgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  type: String,
  animated: Boolean,
});

const FlowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name for this flow'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  executionStatus: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'failed'],
    default: 'draft',
  },
  completedNodes: [String], // Array of completed node IDs
});

// Update the updatedAt field before saving
FlowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Flow', FlowSchema);