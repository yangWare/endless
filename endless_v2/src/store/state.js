import { reactive } from 'vue'
import { db } from './db'
import { createDefaultPlayer } from './actions/player'

export const state = reactive({
  currentMapId: '1',
  currentLocationId: '1',
  player: createDefaultPlayer(),
  /**
   * 敌人状态
   * @type {Object.<string, Object.<string, {hp: number, enemyId: string, locationId: string}>>}
   * 第一级 key: locationId (地点ID)
   * 第二级 key: instanceId (敌人实例ID)
   * value: {
   *   hp: 当前血量
   *   enemyId: 怪物类型id，对应enemy_config中的敌人id
   *   locationId: 敌人所在的地点id
   * }
   */
  enemyStatus: {},
  /** 敌人更新时间，key是loationId, value是更新时间 */
  enemyUpdateTime: {},
})
console.log(state)

/**
 * 从IndexedDB初始化状态
 * @returns {Promise<void>}
 */
export async function initState() {
  const savedState = await db.getState()
  if (savedState) {
    // 移除id字段，因为这是IndexedDB用于存储的key
    const { id, ...stateData } = savedState
    const player = {
      ...state.player,
      ...stateData.player,
    }
    stateData.player = player
    Object.assign(state, stateData)
  }
}

/**
 * 更新状态并保存到IndexedDB
 * @param {Partial<typeof state>} newState 要更新的状态
 * @returns {Promise<void>}
 */
export async function updateState(newState) {
  Object.assign(state, newState)
  await db.saveState(JSON.parse(JSON.stringify(state)))
}

/**
 * 更新玩家状态
 * @param {Partial<typeof state.player>} playerData 要更新的玩家数据
 * @returns {Promise<void>}
 */
export async function updatePlayer(playerData) {
  Object.assign(state.player, playerData)
  await db.saveState(JSON.parse(JSON.stringify(state)))
}
