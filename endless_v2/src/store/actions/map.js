import { state, updateState } from '../state'
import mapConfig from '../../config/map_config.json'

export const move = async(toId) => {
  const fromId = state.currentLocationId

  if (fromId === toId) {
    return
  }

  const fromLocation = mapConfig[state.currentMapId].locations[fromId]
  const toLocation = mapConfig[state.currentMapId].locations[toId]

  if (!fromLocation || !toLocation) {
    return Promise.reject(new Error("无效的位置ID"))
  }

  if (!fromLocation.adjacent_locations.includes(Number(toId))) {
    return Promise.reject(new Error(`无法移动到${toLocation.name}，该位置与当前位置不相邻`))
  }

  const distance = Math.sqrt(
    Math.pow(toLocation.position.x - fromLocation.position.x, 2) +
      Math.pow(toLocation.position.y - fromLocation.position.y, 2),
  )
  const duration = Math.floor((distance / 50) * 1000)

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, duration)
  })

  updateState({ currentLocationId: toId })
}
