import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
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
  enemies: [{
    creatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creature',
      required: true
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    maxCount: {
      type: Number,
      required: true,
      min: 1
    }
  }],
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

export const Location = mongoose.model('Location', locationSchema); 