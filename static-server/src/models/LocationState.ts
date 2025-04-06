import mongoose from 'mongoose';

const locationStateSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  enemyRefreshTimes: [{
    creatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creature',
      required: true
    },
    refreshTime: {
      type: Date,
      required: true
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
locationStateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const LocationState = mongoose.model('LocationState', locationStateSchema); 