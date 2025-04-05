import mongoose from 'mongoose';
import { Counter } from './Counter';

const locationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mapId: {
    type: Number,
    required: true
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  adjacentLocations: [{
    type: Number,
    required: true
  }],
  npc: {
    type: {
      forge: {
        level: {
          type: Number,
          default: 1
        }
      },
      shop: {
        type: {
          items: [{
            id: {
              type: String,
              required: true
            },
            price: {
              type: Number,
              required: true
            }
          }]
        },
        default: {}
      }
    },
    default: {}
  },
  enemy: {
    type: Map,
    of: {
      probability: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      maxCount: {
        type: Number,
        required: true
      }
    },
    default: new Map()
  },
  enemyUpdateDuration: {
    type: Number,
    default: 3600000 // 默认1小时
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
locationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 在保存前自动生成递增的 ID
locationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'locationId',
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

export const Location = mongoose.model('Location', locationSchema); 