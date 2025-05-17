<template>
  <div class="map-container" :style="{ backgroundImage: currentMap ? `url(${currentMap.bgImage})` : '' }">
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

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { state } from '../store/state'
import LocationView from './LocationView.vue'
import Message from './Message.vue'
import { move } from '../store/actions/map'
import type { Map, Location } from '../api'
// import zoneConfig from '../config/zone_config.json'

const mapCanvas = ref<HTMLCanvasElement | null>(null)
const showLocationView = ref<boolean>(false)
const currentMap = computed<Map | null>(() => state.currentMap)

const showMovingMessage = ref<boolean>(false)
const movingMessage = ref<string>('')

// 计算点与圆角矩形的交点
const getIntersectionPoint = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  radius: number
) => {
  // 计算两点之间的角度
  const angle = Math.atan2(y2 - y1, x2 - x1)
  
  // 计算矩形中心点
  const centerX = rectX + rectWidth / 2
  const centerY = rectY + rectHeight / 2
  
  // 计算从中心点到边框的距离
  const halfWidth = rectWidth / 2
  const halfHeight = rectHeight / 2
  
  // 计算与矩形边框的交点
  let intersectX: number, intersectY: number
  
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

const drawMap = (): void => {
  const canvas = mapCanvas.value
  if (!canvas || !currentMap.value) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置 canvas 尺寸
  canvas.width = currentMap.value.width
  canvas.height = currentMap.value.height

  // 绘制半透明蒙层
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, currentMap.value.width, currentMap.value.height)

  // 绘制区域
  // zoneConfig.zones.forEach(zone => {
  //   if (zone.points.length < 3) return // 至少需要3个点才能形成区域

  //   ctx.beginPath()
  //   ctx.moveTo(zone.points[0].x, zone.points[0].y)
    
  //   // 连接所有点
  //   for (let i = 1; i < zone.points.length; i++) {
  //     ctx.lineTo(zone.points[i].x, zone.points[i].y)
  //   }
    
  //   // 闭合路径
  //   ctx.closePath()
    
  //   // 设置填充颜色
  //   ctx.fillStyle = zone.bg_color
  //   ctx.fill()
  // })

  const drawnConnections = new Set<string>()
  // 绘制地点和连线
  Object.values(state.mapLocations).forEach((location: Location) => {
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
    location.adjacentLocations.forEach((adjacentId: string | number) => {
      const connectionKey = [location._id, adjacentId].sort().join('-')
      if (!drawnConnections.has(connectionKey)) {
        const adjacentLocation = state.mapLocations[adjacentId]
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
    ctx.strokeStyle = state.currentLocationId === location._id ? '#ff4444' : '#ffd700'
    ctx.lineWidth = 2
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8)
    ctx.stroke()

    // 为当前地点添加特殊效果
    if (state.currentLocationId === location._id) {
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

const handleLocationClick = async (event: MouseEvent): Promise<void> => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  Object.keys(state.mapLocations).forEach(async (id: string) => {
    const location = state.mapLocations[id]
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
        movingMessage.value = error instanceof Error ? error.message : '移动失败'
        setTimeout(() => {
          showMovingMessage.value = false
        }, 2000)
      }
    }
  })
}

// 聚焦到当前地点
const focusOnCurrentLocation = (): void => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  const container = canvas.parentElement
  if (!container) return
  
  const currentLocation = state.mapLocations[state.currentLocationId]
  
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
  if (!canvas) return
  
  canvas.addEventListener('click', handleLocationClick)
  drawMap()

  // 初始定位
  focusOnCurrentLocation()

  // 打开地点页
  showLocationView.value = true
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
