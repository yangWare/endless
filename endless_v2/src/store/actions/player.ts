import { state, updatePlayer } from '../state'
import { enemyApi, playerApi } from '../../api'
import type { Player, DroppedMaterial } from '../../api'


interface AttackResult {
  result: 'enemy_dead' | 'continue' | 'player_dead'
  damage?: number
  isCritical?: boolean
  remainingHp?: number
  counterDamage?: number
  isCounterCritical?: boolean
  isPlayerDead?: boolean
  droppedMaterials?: DroppedMaterial[]
}

/**
 * 生成玩家战斗属性
 * @returns {Promise<void>}
 */
export async function generateCombatStats(): Promise<void> {
  const player = state.player as Player
  
  if (!player?._id) {
    console.error('玩家ID不存在')
    throw new Error('玩家ID不存在')
  }
  
  try {
    // 调用后端API获取战斗属性
    const response = await playerApi.getCombatStats({
      playerId: player._id
    })
    
    if (!response.success) {
      throw new Error(response.message || '获取战斗属性失败')
    }
    
    const combatStats = response.data
    
    // 更新玩家状态
    await updatePlayer({
      ...player,
      combat_stats: combatStats
    })
    
    return Promise.resolve()
  } catch (error) {
    console.error('获取战斗属性失败:', error)
    throw error
  }
}

/**
 * 玩家攻击敌人
 * @param {string} enemyInstanceId 敌人实例ID
 * @returns {Promise<AttackResult>} 攻击结果
 */
export async function attackEnemy(enemyInstanceId: string): Promise<AttackResult> {
  const player = state.player as Player
  
  if (!player?._id) {
    console.error('玩家ID不存在')
    throw new Error('玩家ID不存在')
  }
  
  try {
    // 调用后端 API 进行攻击
    const response = await enemyApi.attack({
      playerId: player._id,
      enemyInstanceId
    })
    
    if (!response.success) {
      throw new Error(response.message || '攻击失败')
    }
    
    const result = response.data
    
    // 根据新的返回类型更新状态
    // 更新敌人状态
    const enemyInstances = { ...state.enemyInstances }
    
    if (result.result === 'enemy_dead') {
      // 敌人死亡，从状态中移除
      if (enemyInstances[enemyInstanceId]) {
        delete enemyInstances[enemyInstanceId]
        updatePlayer(player)
      }
      
      // 如果有掉落物品，更新玩家物品
      if (result.droppedMaterials && result.droppedMaterials.length > 0) {
        const newPlayer = { ...player }
        newPlayer.inventory.materials = [...newPlayer.inventory.materials, ...result.droppedMaterials.map(m => m.materialId)]
        updatePlayer(newPlayer)
      }
    } else if (result.result === 'continue' && result.remainingHp !== undefined) {
      // 战斗继续，更新敌人血量
      if (enemyInstances[enemyInstanceId]) {
        enemyInstances[enemyInstanceId].hp = result.remainingHp
      }
      
      // 更新玩家血量（如果受到反击伤害）
      if (result.counterDamage && player.combat_stats) {
        const newHp = Math.max(0, player.combat_stats.max_hp - result.counterDamage)
        const newCombatStats = { ...player.combat_stats, max_hp: newHp }
        updatePlayer({
          ...player,
          combat_stats: newCombatStats
        })
      }
    } else if (result.result === 'player_dead' && player.combat_stats) {
      // 玩家死亡
      const newCombatStats = { ...player.combat_stats, max_hp: 0 }
      updatePlayer({
        ...player,
        combat_stats: newCombatStats
      })
      // TODO: 复活逻辑
    }
    
    return result
  } catch (error) {
    console.error('攻击敌人失败:', error)
    throw error
  }
}

/**
 * 穿戴装备
 * @param {string} equipmentId 装备ID
 * @returns {Promise<void>}
 */
export async function equipItem(equipmentId: string): Promise<void> {
  const player = state.player as Player

  if (!player?._id) {
    console.error('玩家ID不存在')
    throw new Error('玩家ID不存在')
  }

  try {
    // 调用后端API穿戴装备
    const response = await playerApi.equipItem({
      playerId: player._id,
      equipmentId
    })

    if (!response.success) {
      throw new Error(response.message || '穿戴装备失败')
    }

    // 更新玩家状态
    await updatePlayer(response.data)
    
    // 重新计算战斗属性
    await generateCombatStats()

    return Promise.resolve()
  } catch (error) {
    console.error('穿戴装备失败:', error)
    throw error
  }
}

/**
 * 计算玩家最大生命值
 * @returns {Promise<number>} 最大生命值
 */
export async function calculateMaxHp(): Promise<number> {
  const player = state.player as Player
  
  // 如果combat_stats不存在或需要刷新，先获取战斗属性
  if (!player?.combat_stats) {
    await generateCombatStats()
  }
  
  // 使用来自后端的战斗属性
  return player?.combat_stats?.max_hp || 0
}