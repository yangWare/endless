<template>
  <div class="map-container" :style="{ backgroundImage: `url(${currentMap.bg_image})` }">
    <canvas ref="mapCanvas" class="map-canvas"></canvas>
    <LocationView v-if="showLocationView" @close="showLocationView = false" />
    <button class="focus-button" @click="focusOnCurrentLocation">
      <span class="focus-icon">📍</span>
    </button>
    <Message
      v-model:visible="showMovingMessage"
      :content="movingMessage"
      type="info"
      :show-button="false"
      :allow-close="false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { state } from '../store/state'
import LocationView from './LocationView.vue'
import Message from './Message.vue'
import mapConfig from '../config/map_config.json'
import { move } from '../store/actions/map'

const mapCanvas = ref(null)
const showLocationView = ref(false)
const currentMap = mapConfig[state.currentMapId]
const locations = currentMap.locations

const showMovingMessage = ref(false)
const movingMessage = ref('')

// 计算点与圆角矩形的交点
const getIntersectionPoint = (x1, y1, x2, y2, rectX, rectY, rectWidth, rectHeight, radius) => {
  // 计算两点之间的角度
  const angle = Math.atan2(y2 - y1, x2 - x1)
  
  // 计算矩形中心点
  const centerX = rectX + rectWidth / 2
  const centerY = rectY + rectHeight / 2
  
  // 计算从中心点到边框的距离
  const halfWidth = rectWidth / 2
  const halfHeight = rectHeight / 2
  
  // 计算与矩形边框的交点
  let intersectX, intersectY
  
  // 根据角度确定与哪条边相交
  if (Math.abs(Math.tan(angle)) * halfWidth <= halfHeight) {
    // 与左右边相交
    intersectX = Math.cos(angle) > 0 ? rectX + rectWidth : rectX
    intersectY = centerY + Math.tan(angle) * (intersectX - centerX)
  } else {
    // 与上下边相交
    intersectY = Math.sin(angle) > 0 ? rectY + rectHeight : rectY
    intersectX = centerX + (intersectY - centerY) / Math.tan(angle)
  }
  
  return { x: intersectX, y: intersectY }
}

const drawMap = () => {
  const canvas = mapCanvas.value
  const ctx = canvas.getContext('2d')

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制半透明蒙层
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const drawnConnections = new Set()

  // 绘制地点和连线
  Object.values(locations).forEach((location) => {
    const x = location.position.x
    const y = location.position.y

    // 计算当前地点的矩形尺寸
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    const text = location.name || '未命名'
    const textWidth = ctx.measureText(text).width
    const padding = 10
    const rectWidth = textWidth + padding * 2
    const rectHeight = 30
    const rectX = x - rectWidth/2
    const rectY = y - rectHeight/2

    // 绘制连线
    location.adjacent_locations.forEach((adjacentId) => {
      const connectionKey = [location.id, adjacentId].sort().join('-')
      if (!drawnConnections.has(connectionKey)) {
        const adjacentLocation = locations[adjacentId]
        if (adjacentLocation) {
          // 计算相邻地点的矩形尺寸
          const adjText = adjacentLocation.name || '未命名'
          const adjTextWidth = ctx.measureText(adjText).width
          const adjRectWidth = adjTextWidth + padding * 2
          const adjRectHeight = 30
          const adjRectX = adjacentLocation.position.x - adjRectWidth/2
          const adjRectY = adjacentLocation.position.y - adjRectHeight/2

          // 计算起点和终点
          const start = getIntersectionPoint(
            x, y,
            adjacentLocation.position.x, adjacentLocation.position.y,
            rectX, rectY, rectWidth, rectHeight, 8
          )
          const end = getIntersectionPoint(
            adjacentLocation.position.x, adjacentLocation.position.y,
            x, y,
            adjRectX, adjRectY, adjRectWidth, adjRectHeight, 8
          )

          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.strokeStyle = '#ffd700'
          ctx.lineWidth = 2
          ctx.stroke()
          drawnConnections.add(connectionKey)
        }
      }
    })

    // 绘制圆角矩形
    ctx.beginPath()
    ctx.strokeStyle = state.currentLocationId === location.id ? '#ff4444' : '#ffd700'
    ctx.lineWidth = 2
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8)
    ctx.stroke()

    // 为当前地点添加特殊效果
    if (Number(state.currentLocationId) === Number(location.id)) {
      // 添加发光效果
      ctx.save()
      ctx.shadowColor = '#ff4444'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.strokeStyle = '#ff4444'
      ctx.lineWidth = 2
      ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8)
      ctx.stroke()
      ctx.restore()
    }

    // 绘制地点名称
    ctx.fillStyle = 'white'
    ctx.fillText(text, x, y + 5)
  })
}

const handleLocationClick = async (event) => {
  const canvas = mapCanvas.value
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  Object.keys(locations).forEach(async (id) => {
    const location = locations[id]
    const locX = location.position.x
    const locY = location.position.y
    if (Math.abs(x - locX) < 20 && Math.abs(y - locY) < 20) {
      try {
        showMovingMessage.value = true
        movingMessage.value = `正在前往${location.name}...`
        await move(id)
        showMovingMessage.value = false
        showLocationView.value = true
      } catch (error) {
        movingMessage.value = error.message
        setTimeout(() => {
          showMovingMessage.value = false
        }, 2000)
      }
    }
  })
}

// 聚焦到当前地点
const focusOnCurrentLocation = () => {
  const canvas = mapCanvas.value
  const container = canvas.parentElement
  const currentLocation = locations[state.currentLocationId]
  
  if (currentLocation) {
    const x = currentLocation.position.x
    const y = currentLocation.position.y
    
    // 计算目标滚动位置，使当前地点位于视口中心
    const scrollX = x - container.clientWidth / 2
    const scrollY = y - container.clientHeight / 2
    
    // 使用平滑滚动
    container.scrollTo({
      left: scrollX,
      top: scrollY,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  const canvas = mapCanvas.value
  canvas.width = currentMap.width
  canvas.height = currentMap.height
  drawMap()
  canvas.addEventListener('click', handleLocationClick)
  
  // 初始定位
  focusOnCurrentLocation()
})

watch(() => state.currentLocationId, drawMap)
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.map-container::-webkit-scrollbar {
  display: none;
}

.map-canvas {
  display: block;
  background-color: transparent;
}

.focus-button {
  position: fixed;
  right: 20px;
  bottom: 100px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.focus-button:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.focus-button:active {
  transform: scale(0.95);
}

.focus-icon {
  font-size: 20px;
}
</style>
