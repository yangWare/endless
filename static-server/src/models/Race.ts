import mongoose from 'mongoose';

const raceSchema = new mongoose.Schema({
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

export const Race = mongoose.model('Race', raceSchema); 