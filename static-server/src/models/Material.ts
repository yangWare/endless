import mongoose from 'mongoose';

export interface IMaterial {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  typeId: mongoose.Types.ObjectId;
  combat_multipliers: {
    max_hp: number;
    attack: number;
    defense: number;
    crit_rate: number;
    crit_resist: number;
    crit_damage: number;
    crit_damage_resist: number;
    hit_rate: number;
    dodge_rate: number;
  };
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialDocument = mongoose.Document & IMaterial;

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialType',
    required: true
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
  level: {
    type: Number,
    required: true,
    default: 1,
    min: 1
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
materialSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Material = mongoose.model<MaterialDocument>('Material', materialSchema); 