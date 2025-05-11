import mongoose from 'mongoose';

const equipmentSchema = {
  id: {
    type: String,
    required: true
  },
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
    },
    perception: {
      type: Number,
      default: 0
    },
    stealth: {
      type: Number,
      default: 0
    },
    escape: {
      type: Number,
      default: 0
    }
  },
  slot: {
    type: String,
    required: true,
    enum: ['weapon', 'armor', 'wrist', 'accessory', 'helmet', 'boots']
  },
  level: {
    type: Number,
    required: true,
    default: 1
  }
};

// 导出装备类型接口
export interface IEquipment {
  id: string;
  name: string;
  level: number;
  slot: 'weapon' | 'armor' | 'wrist' | 'accessory' | 'helmet' | 'boots';
  combatStats: {
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
}

// 导出玩家类型接口
export interface IPlayer {
  username: string;
  password: string;
  nickname: string;
  currentMap: mongoose.Types.ObjectId | null;
  currentLocation: mongoose.Types.ObjectId | null;
  currentLocationIndex: number;
  hp: number;
  coins: number;
  levelInfo: {
    level: number;
    exp: number;
  };
  inventory: {
    materials: mongoose.Types.ObjectId[];
    potions: mongoose.Types.ObjectId[];
    equipments: IEquipment[];
  };
  equipped: {
    weapon: IEquipment | null;
    armor: IEquipment | null;
    wrist: IEquipment | null;
    accessory: IEquipment | null;
    helmet: IEquipment | null;
    boots: IEquipment | null;
  };
  fightingEnemies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// 导出玩家文档类型
export type PlayerDocument = mongoose.Document & IPlayer;

const playerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true,
    unique: true
  },
  hp: {
    type: Number,
    required: true,
    default: 100
  },
  coins: {
    type: Number,
    required: true,
    default: 0
  },
  currentMap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
    default: null
  },
  currentLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  currentLocationIndex: {
    type: Number,
    required: true,
    default: 0
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
  // 心法列表
  heartSkills: [{
    name: {
      type: String,
      required: true
    },
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
  }],
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
    // 武器
    weapon: equipmentSchema,
    // 盔甲 
    armor: equipmentSchema,
    // 手镯，补充：可以为空
    wrist: {
      type: equipmentSchema,
      default: null
    },
    // 项链
    accessory: equipmentSchema,
    // 头盔
    helmet: equipmentSchema,
    // 靴子
    boots: equipmentSchema
  },
  fightingEnemies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnemyInstance'
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
playerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Player = mongoose.model('Player', playerSchema); 