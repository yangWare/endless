import potionConfig from '../../config/potion_config.json'
import { state, updatePlayer } from '../state'
import { calculateMaxHp } from './player'

/**
 * 使用药剂
 * @param {string} potionId - 药剂ID
 * @returns {Promise<boolean>} - 使用是否成功
 */
export const usePotion = async (potionId) => {
  try {
    // 获取药剂配置
    const potionConfig = potionConfig.potions[potionId]
    if (!potionConfig) {
      console.error(`药剂 ${potionId} 不存在`)
      return false
    }

    // 获取玩家当前状态
    const player = state.player
    if (!player) {
      console.error('玩家状态不存在')
      return false
    }

    // 处理药剂效果
    const { effect } = potionConfig
    if (effect.type === 'hp') {
      // 计算最大生命值和恢复后的生命值
      const maxHp = calculateMaxHp()
      const newHp = Math.min(maxHp, player.hp + effect.value)
      
      // 更新玩家生命值
      const newPlayer = { ...player, hp: newHp }
      await updatePlayer(newPlayer)
      
      return true
    }

    console.error(`未知的药剂效果类型: ${effect.type}`)
    return false
  } catch (error) {
    console.error('使用药剂失败:', error)
    return false
  }
} 