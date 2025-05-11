import { state, clearLocationEnemies, updateLocationEnemies } from '../state'
import { locationApi, enemyApi } from '../../api'
import type { EnemyInstance, CombatStats } from '../../api'

/**
 * 生成敌人的战斗属性
 * @param creatureId - 生物ID
 * @returns 敌人的战斗属性
 */
export const generateEnemyCombatStats = async (creatureId: string): Promise<CombatStats> => {
  try {
    const response = await enemyApi.calculateCombatStats(creatureId);
    if (!response.success) {
      throw new Error(response.message || '获取战斗属性失败');
    }
    return response.data;
  } catch (error) {
    console.error('获取战斗属性失败:', error);
    throw error;
  }
}

/**
 * 生成敌人实例
 * @returns Promise<void>
 */
export const generateEnemies = async (isCotinue: 0 | 1): Promise<void> => {
  const playerId = state.player._id
  const locationId = state.currentLocationId
  const currentLocation = state.mapLocations[locationId]
  
  if (!currentLocation || !currentLocation.enemies || currentLocation.enemies.length === 0) {
    return Promise.resolve()
  }

  try {
    // 清理state中所有敌人实例
    clearLocationEnemies()

    // 调用后端 API 生成敌人
    const enemies = await locationApi.generateEnemies(locationId, playerId, isCotinue)

    // 将后端返回的敌人实例添加到状态中
    updateLocationEnemies(enemies.map(item => {
      return {
        instanceId: item._id,
        name: item.creatureId.name,
        enemy: item
      }
    }))
  } catch (error) {
    console.error('生成敌人失败:', error)
    throw error
  }
} 