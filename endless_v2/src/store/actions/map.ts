import { state } from '../state'
import { playerApi } from '../../api'

/**
 * 移动玩家到指定位置
 * @param toId 目标位置ID
 * @throws Error 如果移动失败
 */
export const move = async (toId: string): Promise<void> => {
  const fromId = state.currentLocationId

  if (fromId === toId) {
    return
  }

  const fromLocation = state.mapLocations[fromId]
  const toLocation = state.mapLocations[toId]

  if (!fromLocation || !toLocation) {
    throw new Error('无效的位置ID')
  }

  if (!fromLocation.adjacentLocations.includes(toId)) {
    throw new Error(`无法移动到${toLocation.name}，该位置与当前位置不相邻`)
  }

  // 计算移动时间
  const distance = Math.sqrt(
    Math.pow(toLocation.position.x - fromLocation.position.x, 2) +
    Math.pow(toLocation.position.y - fromLocation.position.y, 2)
  )
  const duration = Math.floor((distance / 50) * 1000)

  // 等待移动动画完成
  await new Promise(resolve => setTimeout(resolve, duration))

  // 调用API更新玩家位置
  const response = await playerApi.updateLocation({
    playerId: state.player?._id || '',
    mapId: state.currentMapId,
    locationId: toId
  })

  if (!response.success) {
    throw new Error(response.message || '移动失败')
  }

  // 更新状态
  state.currentLocationId = toId
  // 置空当前地点的敌人列表所在的地点，以便下次刷新敌人列表
  state.locationOfEnemy = ''
}