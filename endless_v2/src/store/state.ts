import { reactive } from 'vue'
import { playerApi, mapApi, locationApi } from '../api'
import type { Player, EnemyInstance, Map, Location } from '../api'

// 定义状态类型
interface State {
  currentMapId: string
  currentLocationId: string
  player: Player | null
  enemyInstances: Record<string, EnemyInstance>
  currentMap: Map | null
  mapLocations: Record<string, Location>
}

export const state = reactive<State>({
  currentMapId: '1',
  currentLocationId: '1',
  player: null,
  enemyInstances: {},
  currentMap: null,
  mapLocations: {}
})

;(window as any).createUser = playerApi.create
;(window as any).deleteUser = playerApi.delete
/**
 * 从后端API初始化玩家状态
 * @returns {Promise<void>}
 * @throws {Error} 初始化失败时抛出错误
 */
export async function initState(): Promise<void> {
  try {
    // 从 URL query 参数获取登录信息
    const urlParams = new URLSearchParams(window.location.search)
    const username = urlParams.get('username')
    const password = urlParams.get('password')

    // 检查登录信息
    if (!username || !password) {
      throw new Error('URL 参数中未找到登录信息')
    }
    
    // 从后端获取玩家数据
    const response = await playerApi.getInfo({
      username,
      password
    })
    
    if (!response.success) {
      throw new Error(response.message || '获取玩家信息失败')
    }
    
    // 更新玩家状态
    state.player = response.data
    state.currentMapId = response.data.currentMap
    state.currentLocationId = response.data.currentLocation
    
    await Promise.all([
      loadMap(state.currentMapId)
    ])
  } catch (error) {
    console.error('初始化状态失败:', error)
    throw error
  }
}

/**
 * 加载地图信息
 * @param {string} mapId 地图ID
 * @returns {Promise<void>}
 * @throws {Error} 加载失败时抛出错误
 */
export async function loadMap(mapId: string): Promise<void> {
  try {
    // 获取地图基本信息
    const mapResult = await mapApi.getById(mapId)
    if (!mapResult.success) {
      throw new Error(mapResult.message || '获取地图信息失败')
    }
    
    // 获取地图的所有地点
    const locationsResult = await locationApi.list({ mapId })
    if (!locationsResult.success) {
      throw new Error(locationsResult.message || '获取地点列表失败')
    }
    
    // 更新状态
    state.currentMap = mapResult.data
    state.mapLocations = {}
    locationsResult.data.locations.forEach(location => {
      state.mapLocations[location._id] = location
    })
  } catch (error) {
    console.error('加载地图信息失败:', error)
    throw error
  }
}

/**
 * 更新当前地图
 * @param {string} mapId 地图ID
 */
export function updateCurrentMap(mapId: string): void {
  if (!state.player) {
    throw new Error('玩家未初始化')
  }

  state.currentMapId = mapId
}

/**
 * 更新当前位置
 * @param {string} locationId 地点ID
 */
export function updateCurrentLocation(locationId: string): void {
  if (!state.player) {
    throw new Error('玩家未初始化')
  }

  state.currentLocationId = locationId
}

/**
 * 更新敌人实例
 * @param {string} instanceId 敌人实例ID
 * @param {Partial<EnemyInstance>} data 要更新的数据
 */
export function updateEnemyInstance(instanceId: string, data: Partial<EnemyInstance>): void {
  state.enemyInstances[instanceId] = {
    ...state.enemyInstances[instanceId],
    ...data
  }
}

/**
 * 删除指定地点中的所有敌人实例
 * @param {string} locationId 地点ID
 */
export function deleteLocationEnemies(locationId: string): void {
  // 遍历所有敌人实例，删除属于指定地点的实例
  Object.keys(state.enemyInstances).forEach(instanceId => {
    if (state.enemyInstances[instanceId].locationId === locationId) {
      delete state.enemyInstances[instanceId]
    }
  })
}

/**
 * 更新玩家状态
 * @param {Partial<Player>} playerData 要更新的玩家数据
 */
export function updatePlayer(playerData: Partial<Player>): void {
  if (!state.player) {
    throw new Error('玩家未初始化')
  }

  Object.assign(state.player, playerData)
}