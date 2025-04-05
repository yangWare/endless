import mongoose from 'mongoose';
import { Counter } from './Counter';

const potionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
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

// 在保存前自动生成递增的 ID
potionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'potionId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

export const Potion = mongoose.model('Potion', potionSchema); 