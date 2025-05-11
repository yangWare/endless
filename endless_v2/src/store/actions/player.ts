import { state, updateLocationEnemies, updatePlayer } from '../state'
import { enemyApi, playerApi } from '../../api'
import type { Player, DroppedMaterial, EnemyInstance } from '../../api'


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
    updatePlayer({
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
 * @returns {Promise<AttackEnemyResult>} 攻击结果
 */
export async function attackEnemy(isContinue: 0 | 1, enemyInstanceId?: string,) {
  const player = state.player as Player
  
  if (!player?._id) {
    console.error('玩家ID不存在')
    throw new Error('玩家ID不存在')
  }
  
  try {
    // 调用后端 API 进行攻击
    const response = await enemyApi.attack({
      playerId: player._id,
      enemyInstanceIds: enemyInstanceId ? [enemyInstanceId] : [],
      isContinue
    })
    
    if (!response.success) {
      throw new Error(response.message || '攻击失败')
    }
    
    return response.data
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