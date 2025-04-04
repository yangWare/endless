import { state, updatePlayer, updateState } from '../state'
import enemyConfig from '../../config/enemy_config.json'
import { generateEnemyCombatStats } from './enemy'

/**
 * 处理敌人死亡
 * @param {typeof state.player} player 玩家数据
 * @param {string} enemyInstanceId 敌人实例ID
 * @param {Object} enemyData 敌人配置数据
 * @returns {Promise<Array<string>>} 掉落的物品列表
 */
async function handleEnemyDrop(player, enemyData) {
  const droppedItems = []
  const dropMaterials = enemyData.drop_materials || []

  for (const drop of dropMaterials) {
    if (Math.random() <= drop.probability) {
      // 将物品添加到玩家背包
      const newPlayer = { ...player }
      newPlayer.materials = [...newPlayer.materials, drop.name]
      await updatePlayer(newPlayer)
      droppedItems.push(drop.name)
    }
  }

  return droppedItems
}

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
 * 处理敌人的反击
 * @param {typeof state.player} player 玩家数据
 * @param {Object} enemyData 敌人配置数据
 * @returns {Promise<{hit: boolean, damage: number, isCrit: boolean}>}
 */
async function handleEnemyCounterAttack(player, enemyData) {
  // 敌人命中判定
  const enemyHitRoll = Math.random()
  const enemyFinalHitRate =
    enemyData.hit_rate * (1 - player.combat_stats.dodge_rate)

  if (enemyHitRoll <= enemyFinalHitRate) {
    // 敌人暴击判定
    const enemyCritRoll = Math.random()
    const enemyFinalCritRate =
      enemyData.crit_rate * (1 - player.combat_stats.crit_resist)
    const isEnemyCrit = enemyCritRoll <= enemyFinalCritRate

    // 敌人伤害计算
    let enemyDamage = enemyData.attack - player.combat_stats.defense
    enemyDamage = Math.max(1, enemyDamage) // 确保至少造成1点伤害

    // 如果暴击，计算暴击伤害
    if (isEnemyCrit) {
      const enemyCritDamageMultiplier =
        enemyData.crit_damage *
        (1 - player.combat_stats.crit_damage_resist)
      enemyDamage = Math.floor(enemyDamage * enemyCritDamageMultiplier)
    }

    // 更新玩家血量
    const newPlayer = { ...player }
    newPlayer.hp = Math.max(0, newPlayer.hp - enemyDamage)
    await updatePlayer(newPlayer)

    const isPlayerAlive = newPlayer.hp > 0

    if (!isPlayerAlive) {
      await updatePlayer(createDefaultPlayer())
    }

    return {
      hit: true,
      damage: enemyDamage,
      isCrit: isEnemyCrit,
      isPlayerAlive,
    }
  }

  return {
    hit: false,
    damage: 0,
    isCrit: false,
    isPlayerAlive: true,
  }
}

/**
 * 玩家攻击敌人
 * @param {string} enemyInstanceId 敌人实例ID
 * @returns {Promise<{hit: boolean, damage: number, isCrit: boolean}>}
 */
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

export async function attackEnemy(enemyInstanceId) {
  const player = state.player

  if (!player.combat_stats) {
    await generateCombatStats()
  }

  // 直接获取当前地点的敌人状态
  const currentLocationEnemies = state.enemyStatus[state.currentLocationId] || {}
  const enemyStatus = currentLocationEnemies[enemyInstanceId]

  if (!enemyStatus) {
    return Promise.reject(new Error('Enemy not found'))
  }

  const creatureId = enemyStatus.enemyId
  const creature = enemyConfig.creatures[creatureId]
  if (!creature) {
    return Promise.reject(new Error('Enemy config not found'))
  }

  // 获取敌人战斗属性
  const enemyCombatStats = generateEnemyCombatStats(creatureId)

  // 命中判定
  const hitRoll = Math.random()
  const finalHitRate =
    player.combat_stats.hit_rate * (1 - enemyCombatStats.dodge_rate)
  
  let counterAttack = null
  let playerAttackResult = { hit: false, damage: 0, isCrit: false }

  if (hitRoll <= finalHitRate) {
    // 暴击判定
    const critRoll = Math.random()
    const finalCritRate =
      player.combat_stats.crit_rate * (1 - enemyCombatStats.crit_resist)
    const isCrit = critRoll <= finalCritRate

    // 伤害计算
    let damage = player.combat_stats.attack - enemyCombatStats.defense
    damage = Math.max(1, damage) // 确保至少造成1点伤害

    // 如果暴击，计算暴击伤害
    if (isCrit) {
      const critDamageMultiplier =
        player.combat_stats.crit_damage *
        (1 - enemyCombatStats.crit_damage_resist)
      damage = Math.floor(damage * critDamageMultiplier)
    }

    playerAttackResult = { hit: true, damage, isCrit }

    // 更新敌人血量
    const newEnemyStatus = { ...state.enemyStatus }
    newEnemyStatus[state.currentLocationId][enemyInstanceId].hp = Math.max(
      0,
      newEnemyStatus[state.currentLocationId][enemyInstanceId].hp - damage,
    )

    // 如果敌人还活着，进行反击
    if (newEnemyStatus[state.currentLocationId][enemyInstanceId].hp > 0) {
      counterAttack = await handleEnemyCounterAttack(player, enemyCombatStats)
    }

    // 如果敌人死亡，处理掉落
    let droppedItems = []
    if (newEnemyStatus[state.currentLocationId][enemyInstanceId].hp <= 0) {
      droppedItems = await handleEnemyDrop(player, creature)
      // 删除死亡的敌人
      delete newEnemyStatus[state.currentLocationId][enemyInstanceId]
    }

    // 更新状态
    await updateState({ enemyStatus: newEnemyStatus })

    return {
      player: playerAttackResult,
      enemy: counterAttack,
      droppedItems,
    }
  }

  // 未命中，敌人反击
  counterAttack = await handleEnemyCounterAttack(player, enemyCombatStats)

  return {
    player: playerAttackResult,
    enemy: counterAttack,
  }
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

/**
 * 生成默认的玩家属性
 * @returns {Object} 默认玩家属性对象
 */
export function createDefaultPlayer() {
  return {
    name: '默认玩家',
    hp: 40,
    level: 1,
    gold: 0,
    materials: [],
    potions: [],
    unequipped: [],
    equipment: {
      weapon: {
        name: '木剑',
        combat_info: {
          attack: 2,
          defense: 0
        },
        position: 'weapon',
        level: 1
      },
      body: {
        name: '布甲',
        combat_info: {
          attack: 0,
          defense: 1,
          max_hp: 20
        },
        position: 'body',
        level: 1
      },
      feet: {
        name: '布鞋',
        combat_info: {
          attack: 1,
          defense: 1
        },
        position: 'feet',
        level: 1
      },
      head: {
        name: '布帽',
        combat_info: {
          attack: 0,
          defense: 1,
          max_hp: 10
        },
        position: 'head',
        level: 1
      }
    }
  }
}
