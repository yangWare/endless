import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Test = mongoose.model('Test', testSchema); 