import mongoose from 'mongoose';

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  bgImage: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  startLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false
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
mapSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Map = mongoose.model('Map', mapSchema); 