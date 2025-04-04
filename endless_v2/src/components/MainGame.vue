<template>
  <div class="game-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="player-hp">HP {{ player.hp }}</span>
      <span class="player-name">{{ player.name }} Lv.{{ player.level }}</span>
      <span class="player-gold">{{ player.gold }} G</span>
    </div>

    <!-- 中间游戏核心区域 -->
    <div class="game-main">
      <MapView v-if="currentView === 'map'" />
      <BagView v-if="currentView === 'bag'" />
      <CharacterView v-if="currentView === 'character'" />
    </div>

    <!-- 底部菜单栏 -->
    <div class="menu-bar">
      <div class="menu-item" @click="openMap">
        <i class="icon-map"></i>
        <span>地图</span>
      </div>
      <div class="menu-item" @click="openBag">
        <i class="icon-bag"></i>
        <span>背包</span>
      </div>
      <div class="menu-item" @click="openCharacter">
        <i class="icon-character"></i>
        <span>人物</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent, watch, computed } from 'vue'

import { state, updatePlayer, initState } from '../store/state'

initState()

const player = computed(() => state.player)

const currentView = ref('map')

const MapView = defineAsyncComponent(() => import('./MapView.vue'))
const BagView = defineAsyncComponent(() => import('./BagView.vue'))
const CharacterView = defineAsyncComponent(() => import('./CharacterView.vue'))

const openMap = () => {
  currentView.value = 'map'
}

const openBag = () => {
  currentView.value = 'bag'
}

const openCharacter = () => {
  currentView.value = 'character'
}

watch(
  player,
  (newValue) => {
    updatePlayer(newValue)
  },
  { deep: true },
)
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #333;
  color: white;
}

.status-bar .player-name {
  text-align: center;
  flex: 1;
  font-weight: bold;
}

.status-bar .player-hp {
  min-width: 100px;
  text-align: left;
}

.status-bar .player-gold {
  min-width: 100px;
  text-align: right;
}

.game-main {
  flex: 1;
  overflow: auto;
}

.menu-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background-color: #444;
}

.menu-bar .menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  color: white;
}

.menu-bar .menu-item i {
  font-size: 24px;
  margin-bottom: 4px;
}

.menu-bar .menu-item:hover {
  color: #ffd700;
}

.menu-bar .menu-item:hover i {
  color: #ffd700;
}
</style>
