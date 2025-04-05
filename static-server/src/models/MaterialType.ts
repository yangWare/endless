import mongoose from 'mongoose';
import { Counter } from './Counter';

const materialTypeSchema = new mongoose.Schema({
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
  combat_bonus: {
    max_hp: {
      type: Number,
      default: null
    },
    attack: {
      type: Number,
      default: null
    },
    defense: {
      type: Number,
      default: null
    },
    crit_rate: {
      type: Number,
      default: null
    },
    crit_resist: {
      type: Number,
      default: null
    },
    crit_damage: {
      type: Number,
      default: null
    },
    crit_damage_resist: {
      type: Number,
      default: null
    },
    hit_rate: {
      type: Number,
      default: null
    },
    dodge_rate: {
      type: Number,
      default: null
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
materialTypeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 在保存前自动生成递增的 ID
materialTypeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'materialTypeId',
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

export const MaterialType = mongoose.model('MaterialType', materialTypeSchema); 