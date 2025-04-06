import mongoose from 'mongoose';

const equipmentSchema = {
  name: {
    type: String,
    required: true
  },
  combatStats: {
    max_hp: {
      type: Number,
      required: true,
      default: 0
    },
    attack: {
      type: Number,
      required: true,
      default: 0
    },
    defense: {
      type: Number,
      required: true,
      default: 0
    },
    crit_rate: {
      type: Number,
      required: true,
      default: 0
    },
    crit_resist: {
      type: Number,
      required: true,
      default: 0
    },
    crit_damage: {
      type: Number,
      required: true,
      default: 0
    },
    crit_damage_resist: {
      type: Number,
      required: true,
      default: 0
    },
    hit_rate: {
      type: Number,
      required: true,
      default: 0
    },
    dodge_rate: {
      type: Number,
      required: true,
      default: 0
    }
  },
  slot: {
    type: String,
    required: true,
    enum: ['weapon', 'armor', 'accessory', 'helmet', 'boots']
  },
  level: {
    type: Number,
    required: true,
    default: 1
  }
};

const playerSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true
  },
  levelInfo: {
    level: {
      type: Number,
      required: true,
      default: 1
    },
    exp: {
      type: Number,
      required: true,
      default: 0
    }
  },
  inventory: {
    materials: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    }],
    potions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Potion'
    }],
    equipments: [equipmentSchema]
  },
  equipped: {
    weapon: equipmentSchema,
    armor: equipmentSchema,
    accessory: equipmentSchema,
    helmet: equipmentSchema,
    boots: equipmentSchema
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
playerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Player = mongoose.model('Player', playerSchema); 