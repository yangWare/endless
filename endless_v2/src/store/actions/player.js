import { state, updatePlayer, updateState } from '../state'
import { enemyApi, playerApi } from '../../api'

/**
 * 生成玩家战斗属性
 * @returns {Promise<void>}
 */
export async function generateCombatStats() {
  const player = state.player
  
  if (!player.id) {
    console.error('玩家ID不存在')
    throw new Error('玩家ID不存在')
  }
  
  try {
    // 调用后端API获取战斗属性
    const response = await playerApi.getCombatStats({
      playerId: player.id
    })
    
    if (!response.success) {
      throw new Error(response.error || '获取战斗属性失败')
    }
    
    const combatStats = response.data
    
    // 更新玩家状态
    await updatePlayer({
      ...player,
      combat_stats: combatStats,
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
    
    // 根据新的返回类型更新状态
    // 更新敌人状态
    const newEnemyStatus = { ...state.enemyStatus };
    
    if (result.result === 'enemy_dead') {
      // 敌人死亡，从状态中移除
      if (newEnemyStatus[state.currentLocationId] && 
          newEnemyStatus[state.currentLocationId][enemyInstanceId]) {
        delete newEnemyStatus[state.currentLocationId][enemyInstanceId];
        await updateState({ enemyStatus: newEnemyStatus });
      }
      
      // 如果有掉落物品，更新玩家物品
      if (result.droppedMaterials && result.droppedMaterials.length > 0) {
        const newPlayer = { ...player };
        newPlayer.materials = [...newPlayer.materials, ...result.droppedMaterials];
        updatePlayer(newPlayer);
      }
    } else if (result.result === 'continue') {
      // 战斗继续，更新敌人血量
      if (newEnemyStatus[state.currentLocationId] && 
          newEnemyStatus[state.currentLocationId][enemyInstanceId]) {
        newEnemyStatus[state.currentLocationId][enemyInstanceId].hp = result.remainingHp;
        await updateState({ enemyStatus: newEnemyStatus });
      }
      
      // 更新玩家血量（如果受到反击伤害）
      if (result.counterDamage) {
        const newHp = Math.max(0, player.hp - result.counterDamage);
        updatePlayer({
          ...player,
          hp: newHp
        });
      }
    } else if (result.result === 'player_dead') {
      // 玩家死亡
      updatePlayer({
        ...player,
        hp: 0
      });
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
export async function calculateMaxHp() {
  const player = state.player
  
  // 如果combat_stats不存在或需要刷新，先获取战斗属性
  if (!player.combat_stats) {
    await generateCombatStats()
  }
  
  // 使用来自后端的战斗属性
  return player.combat_stats.max_hp
}