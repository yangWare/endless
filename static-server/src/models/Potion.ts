import mongoose from 'mongoose';

const potionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  effect: {
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});

// 在保存前更新 updatedAt
potionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Potion = mongoose.model('Potion', potionSchema); 