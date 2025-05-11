<template>
  <div class="tavern-view">
    <button class="close-button" @click.stop="handleCloseClick">×</button>
    <div class="tavern-header">
      <h2>酒馆情报</h2>
      <p class="subtitle">在这里你可以获取各种生物的情报</p>
      <button class="refresh-btn" @click="fetchCreatures">
        换一批
      </button>
    </div>

    <div class="creatures-list">
      <div v-for="creature in currentLocation.enemies || []" :key="creature.creatureId._id" class="creature-item">
        <div class="creature-info">
          <div class="creature-details">
            <h3>{{ creature.creatureId.name }}</h3>
            <p class="creature-type">{{ currentLocation.name }}</p>
          </div>
        </div>
        <button 
          class="info-btn"
          @click="showCreatureDetails(creature)"
        >
          获取情报
        </button>
      </div>
    </div>

    <Message
      v-model:visible="showIntelInfoModal"
      :content="intelInfo"
      type="info"
      :show-button="false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, defineEmits } from 'vue'
import type { Location } from '../api'
import { locationApi } from '../api'
import { state, updatePlayer } from '../store/state'
import Message from './Message.vue'
import i18nConfig from '../config/i18n_config.json'

const currentLocation = ref<{
  name: string
  enemies: Location['enemies']
}>({
  name: '',
  enemies: []
})
const playerGold = ref(1000) // 这里应该从游戏状态管理中获取

const fetchCreatures = async () => {
  const locationIds = Object.keys(state.mapLocations).filter(key => {
    return !!state.mapLocations[key].enemies?.length
  })
  const index = Math.floor(Math.random() * locationIds.length)
  currentLocation.value = state.mapLocations[locationIds[index]]
}

const showIntelInfoModal = ref(false)
const intelInfo = ref('')
const showCreatureDetails = async (creature: Location['enemies'][number]) => {
  showIntelInfoModal.value = true
  intelInfo.value = '加载中...'
  const res = await locationApi.getCreatureIntel({
    playerId: state.player._id,
    creatureId: creature.creatureId._id
  })

  if (!res.success) {
    intelInfo.value = `${res.message}`
    return 
  }

  let content = `${creature.creatureId.name}<br>`
  content += `情报价值: ${res.data.cost}金币<br>`
  content += '类型：'
  if (res.data.creature.level <= 2 ) {
    content += '普通<br>'
  } else if (res.data.creature.level <= 4) {
    content += '精英<br>'
  } else {
    content += 'BOSS<br>'
  }
  for (const [key, value] of Object.entries(res.data.creatureCombatStats)) {
    content += `${i18nConfig.combat_stats[key as keyof typeof i18nConfig.combat_stats]}: ${value}<br>`
  }
  intelInfo.value = content.trim()
  const newPlayer = { ...state.player }
  newPlayer.coins -= res.data.cost
  updatePlayer(newPlayer)
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleCloseClick = (): void => {
  emit('close')
}

onMounted(() => {
  fetchCreatures()
})
</script>

<style scoped>
.tavern-view {
background-color: #fff;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.tavern-header {
  text-align: center;
  margin-bottom: 30px;
}

.subtitle {
  color: #666;
  font-size: 0.9em;
}

.creatures-list {
  display: grid;
  gap: 15px;
}

.creature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.creature-item:hover {
  background: #eaeaea;
}

.creature-info {
  display: flex;
  align-items: center;
  gap: 15px;
  text-align: left;
}

.creature-details h3 {
  margin: 0;
  font-size: 1.1em;
}

.creature-type {
  color: #666;
  font-size: 0.9em;
  margin: 5px 0 0;
}

.info-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.refresh-btn {
  margin-top: 10px;
  padding: 8px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.refresh-btn:hover {
  background: #1976D2;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #404040;
  color: #e0e0e0;
  font-size: 24px;
  float: right;
  line-height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
}

.close-button:hover {
  background-color: #ff4d00;
  transform: rotate(90deg);
}
</style> 