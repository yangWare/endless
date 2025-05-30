import mongoose from 'mongoose';

const enemyInstanceSchema = new mongoose.Schema({
  creatureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creature',
    required: true
  },
  hp: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  locationIndex: {
    type: Number,
    default: -1
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
enemyInstanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EnemyInstance = mongoose.model('EnemyInstance', enemyInstanceSchema); 