import mapConfig from '../../config/map_config.json'
import enemyConfig from '../../config/enemy_config.json'
import { state, updateState } from '../state'

/**
 * 生成敌人的战斗属性
 * @param {string} raceId - 种族ID
 * @param {string} creatureId - 生物ID
 * @returns {Object} 敌人的战斗属性
 */
export const generateEnemyCombatStats = (creatureId) => {
  // 获取基础战斗属性
  const baseStats = enemyConfig.base_combat_stats

  // 获取生物配置
  const creature = enemyConfig.creatures[creatureId]
  const raceId = creature.raceId

  // 获取种族倍率
  const race = enemyConfig.races[raceId]
  if (!race) {
    throw new Error(`Invalid race ID: ${raceId}`)
  }
  const raceMultipliers = race.combat_multipliers

  if (!creature) {
    throw new Error(`Invalid creature ID: ${creatureId}`)
  }
  const creatureMultipliers = creature.combat_multipliers

  // 计算等级加成
  const level = creature.level || 1

  // 计算最终战斗属性
  return {
    max_hp: Math.floor(
      baseStats.max_hp *
        level *
        raceMultipliers.max_hp *
        creatureMultipliers.max_hp,
    ),
    attack: Math.floor(
      baseStats.attack *
        level *
        raceMultipliers.attack *
        creatureMultipliers.attack,
    ),
    defense: Math.floor(
      baseStats.defense *
        level *
        raceMultipliers.defense *
        creatureMultipliers.defense,
    ),
    crit_rate:
      baseStats.crit_rate *
      raceMultipliers.crit_rate *
      creatureMultipliers.crit_rate,
    crit_resist:
      baseStats.crit_resist *
      raceMultipliers.crit_resist *
      creatureMultipliers.crit_resist,
    crit_damage:
      baseStats.crit_damage *
      raceMultipliers.crit_damage *
      creatureMultipliers.crit_damage,
    crit_damage_resist:
      baseStats.crit_damage_resist *
      raceMultipliers.crit_damage_resist *
      creatureMultipliers.crit_damage_resist,
    hit_rate:
      baseStats.hit_rate *
      raceMultipliers.hit_rate *
      creatureMultipliers.hit_rate,
    dodge_rate:
      baseStats.dodge_rate *
      raceMultipliers.dodge_rate *
      creatureMultipliers.dodge_rate,
  }
}

/**
 * 生成敌人实例
 * @param {string} locationId - 地点ID
 * @returns {Promise<void>}
 */
export const generateEnemies = () => {
  const locationId = state.currentLocationId
  const currentLocation = mapConfig[state.currentMapId].locations[locationId]
  if (!currentLocation || !currentLocation.enemy) {
    return Promise.resolve()
  }

  // 检查刷新时间
  const currentTime = Date.now()
  const lastUpdateTime = state.enemyUpdateTime?.[locationId] || 0
  const updateDuration = currentLocation.enemy_update_duration || 3600000 // 默认1小时

  // 如果未超过刷新时间，直接返回
  if (currentTime - lastUpdateTime < updateDuration) {
    return Promise.resolve()
  }

  // 清理当前地点的所有敌人实例
  const newEnemyStatus = { ...state.enemyStatus }
  delete newEnemyStatus[locationId]

  // 更新状态
  updateState({
    enemyStatus: newEnemyStatus,
    enemyUpdateTime: {
      ...state.enemyUpdateTime,
      [locationId]: currentTime,
    },
  })

  // 初始化当前地点的敌人实例容器
  newEnemyStatus[locationId] = {}

  // 生成新的敌人实例
  Object.entries(currentLocation.enemy).forEach(([enemyId, enemyConfig]) => {
    const maxCount = enemyConfig.max_count

    for (let i = 0; i < maxCount; i++) {
      const instanceId = `${enemyId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const combatStats = generateEnemyCombatStats(enemyId)

      newEnemyStatus[locationId][instanceId] = {
        hp: combatStats.max_hp,
        enemyId: enemyId,
        locationId: locationId,
      }

      updateState({
        enemyStatus: newEnemyStatus,
      })
    }
  })

  return Promise.resolve()
}
