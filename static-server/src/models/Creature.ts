import mongoose from 'mongoose';
import { Counter } from './Counter';

const creatureSchema = new mongoose.Schema({
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
  raceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
    required: true
  },
  level: {
    type: Number,
    required: true,
    default: 1
  },
  combat_multipliers: {
    max_hp: {
      type: Number,
      required: true,
      default: 1.0
    },
    attack: {
      type: Number,
      required: true,
      default: 1.0
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
  drop_materials: [{
    name: {
      type: String,
      required: true
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    }
  }],
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
creatureSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 在保存前自动生成递增的 ID
creatureSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'creatureId',
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

export const Creature = mongoose.model('Creature', creatureSchema); 