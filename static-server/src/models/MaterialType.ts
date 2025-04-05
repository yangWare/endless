import mongoose from 'mongoose';

const materialTypeSchema = new mongoose.Schema({
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

export const MaterialType = mongoose.model('MaterialType', materialTypeSchema); 