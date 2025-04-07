import { state, updatePlayer, updateState } from '../state'
import { enemyApi } from '../../api'

/**
 * 玩家基础属性
 */
const BASE_STATS = {
  // 最大血量
  max_hp: 10,
  // 攻击力
  attack: 1,
  // 防御力
  defense: 1,
  // 暴击率
  crit_rate: 0.05,
  // 暴击抵抗
  crit_resist: 0.01,
  // 暴击伤害
  crit_damage: 1.5,
  // 暴击伤害抵抗
  crit_damage_resist: 0.1,
  // 命中率
  hit_rate: 1,
  // 闪避率
  dodge_rate: 0.1,
}

/**
 * 等级成长系数
 */
const LEVEL_GROWTH = {
  max_hp: 1.2, // 每级血量增长20%
  attack: 1.15, // 每级攻击增长15%
  defense: 1.1, // 每级防御增长10%
}

/**
 * 生成玩家战斗属性
 * @returns {Promise<void>}
 */
export async function generateCombatStats() {
  const player = state.player
  const level = player.level

  // 计算等级加成后的属性
  const combatStats = {
    max_hp: Math.floor(
      BASE_STATS.max_hp * Math.pow(LEVEL_GROWTH.max_hp, level - 1),
    ),
    attack: Math.floor(
      BASE_STATS.attack * Math.pow(LEVEL_GROWTH.attack, level - 1),
    ),
    defense: Math.floor(
      BASE_STATS.defense * Math.pow(LEVEL_GROWTH.defense, level - 1),
    ),
    // 这些属性不随等级变化
    crit_rate: BASE_STATS.crit_rate,
    crit_resist: BASE_STATS.crit_resist,
    crit_damage: BASE_STATS.crit_damage,
    crit_damage_resist: BASE_STATS.crit_damage_resist,
    hit_rate: BASE_STATS.hit_rate,
    dodge_rate: BASE_STATS.dodge_rate,
  }

  // 遍历当前已穿戴装备，将装备属性加成计入最终属性
  Object.values(player.equipment).forEach((equipment) => {
    if (equipment) {
      Object.keys(equipment.combat_info).forEach((stat) => {
        combatStats[stat] += equipment.combat_info[stat]
      })
    }
  })

  // 更新玩家状态
  await updatePlayer({
    ...player,
    combat_stats: combatStats,
  })

  return Promise.resolve()
}

/**
 * 玩家攻击敌人
 * @param {string} enemyInstanceId 敌人实例ID
 * @returns {Promise<Object>} 攻击结果
 */
export async function attackEnemy(enemyInstanceId) {
  const player = state.player
  
  if (!player.id) {
    console.error('玩家ID不存在');
    throw new Error('玩家ID不存在');
  }
  
  try {
    // 调用后端 API 进行攻击
    const response = await enemyApi.attack({
      playerId: player.id,
      enemyInstanceId
    });
    
    if (!response.success) {
      throw new Error(response.message || '攻击失败');
    }
    
    const result = response.data;
    
    // 更新玩家状态
    if (result.player && typeof result.player.hp !== 'undefined') {
      await updatePlayer({
        ...player,
        hp: result.player.hp
      });
    }
    
    // 更新敌人状态
    if (result.enemy) {
      const newEnemyStatus = { ...state.enemyStatus };
      
      // 如果敌人死亡，从状态中移除
      if (result.enemy.hp <= 0) {
        delete newEnemyStatus[state.currentLocationId][enemyInstanceId];
      } else {
        // 更新敌人血量
        if (newEnemyStatus[state.currentLocationId] && 
            newEnemyStatus[state.currentLocationId][enemyInstanceId]) {
          newEnemyStatus[state.currentLocationId][enemyInstanceId].hp = result.enemy.hp;
        }
      }
      
      await updateState({ enemyStatus: newEnemyStatus });
    }
    
    // 如果有掉落物品，更新玩家物品
    if (result.droppedItems && result.droppedItems.length > 0) {
      const newPlayer = { ...player };
      newPlayer.materials = [...newPlayer.materials, ...result.droppedItems];
      await updatePlayer(newPlayer);
    }
    
    return result;
  } catch (error) {
    console.error('攻击敌人失败:', error);
    throw error;
  }
}

/**
 * 穿戴装备
 * @param {string} equipmentName 装备名称
 * @returns {Promise<void>}
 */
export async function equipItem(equipmentName) {
  const player = state.player

  // 查找装备
  const equipmentIndex = player.unequipped.findIndex(
    (item) => item.name === equipmentName,
  )
  if (equipmentIndex === -1) {
    return Promise.reject(new Error('装备不存在'))
  }

  const equipment = player.unequipped[equipmentIndex]
  const position = equipment.position

  // 如果该位置已有装备，先卸下
  if (player.equipment[position]) {
    player.unequipped.push(player.equipment[position])
  }

  // 更新装备状态
  const newPlayer = { ...player }
  newPlayer.equipment[position] = equipment
  newPlayer.unequipped = [
    ...newPlayer.unequipped.slice(0, equipmentIndex),
    ...newPlayer.unequipped.slice(equipmentIndex + 1),
  ]

  // 更新玩家状态并重新计算战斗属性
  await updatePlayer(newPlayer)
  await generateCombatStats()
}

/**
 * 计算玩家最大生命值
 * @returns {number} 最大生命值
 */
export function calculateMaxHp() {
  const player = state.player
  const level = player.level

  // 计算基础生命值
  let maxHp = Math.floor(
    BASE_STATS.max_hp * Math.pow(LEVEL_GROWTH.max_hp, level - 1)
  )

  // 加上装备加成
  Object.values(player.equipment).forEach((equipment) => {
    if (equipment && equipment.combat_info.max_hp) {
      maxHp += equipment.combat_info.max_hp
    }
  })

  return maxHp
}