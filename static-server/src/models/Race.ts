import mongoose from 'mongoose';
import { Counter } from './Counter';

const raceSchema = new mongoose.Schema({
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
  parentRace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
    default: null
  },
  combatStats: {
    max_hp: {
      type: Number,
      required: true,
      default: 10.0
    },
    attack: {
      type: Number,
      required: true,
      default: 2.0
    },
    defense: {
      type: Number,
      required: true,
      default: 1.0
    },
    crit_rate: {
      type: Number,
      required: true,
      default: 1.0
    },
    crit_resist: {
      type: Number,
      required: true,
      default: 1.0
    },
    crit_damage: {
      type: Number,
      required: true,
      default: 1.0
    },
    crit_damage_resist: {
      type: Number,
      required: true,
      default: 1.0
    },
    hit_rate: {
      type: Number,
      required: true,
      default: 1.0
    },
    dodge_rate: {
      type: Number,
      required: true,
      default: 1.0
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
raceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 在保存前自动生成递增的 ID
raceSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'raceId',
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

export const Race = mongoose.model('Race', raceSchema); 