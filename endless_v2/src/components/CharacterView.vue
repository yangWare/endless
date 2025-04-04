<template>
  <div class="character-view">
    <Message
      v-model:visible="showMessage"
      :content="messageContent"
      :type="messageType"
      :show-button="showButton"
      :button-text="buttonText"
      @action="handleAction"
    />
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">{{ i18nConfig.combat_stats.max_hp }}:</span>
        <span class="stat-value"
          >{{ player.hp }}/{{ player.combat_stats?.max_hp || 0 }}</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ i18nConfig.combat_stats.attack }}:</span>
        <span class="stat-value">{{ player.combat_stats?.attack || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ i18nConfig.combat_stats.defense }}:</span>
        <span class="stat-value">{{ player.combat_stats?.defense || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ i18nConfig.combat_stats.crit_rate }}:</span>
        <span class="stat-value"
          >{{ (player.combat_stats?.crit_rate * 100 || 0).toFixed(1) }}%</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label"
          >{{ i18nConfig.combat_stats.crit_resist }}:</span
        >
        <span class="stat-value"
          >{{ (player.combat_stats?.crit_resist * 100 || 0).toFixed(1) }}%</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label"
          >{{ i18nConfig.combat_stats.crit_damage }}:</span
        >
        <span class="stat-value"
          >{{ (player.combat_stats?.crit_damage * 100 || 0).toFixed(1) }}%</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label"
          >{{ i18nConfig.combat_stats.crit_damage_resist }}:</span
        >
        <span class="stat-value"
          >{{
            (player.combat_stats?.crit_damage_resist * 100 || 0).toFixed(1)
          }}%</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ i18nConfig.combat_stats.hit_rate }}:</span>
        <span class="stat-value"
          >{{ (player.combat_stats?.hit_rate * 100 || 0).toFixed(1) }}%</span
        >
      </div>
      <div class="stat-item">
        <span class="stat-label"
          >{{ i18nConfig.combat_stats.dodge_rate }}:</span
        >
        <span class="stat-value"
          >{{ (player.combat_stats?.dodge_rate * 100 || 0).toFixed(1) }}%</span
        >
      </div>
    </div>

    <div class="equipment-section">
      <div class="equipment-title">当前装备</div>
      <ul class="equipment-list">
        <li
          v-for="[position, item] in Object.entries(player.equipment)"
          :key="position"
          class="equipment-item"
          @click="showEquipmentInfo(item)"
        >
          <span class="equipment-name">{{ item.name }}</span>
          <span class="equipment-position">{{
            positionMap[position].name || position
          }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { state } from '../store/state'
import { generateCombatStats } from '../store/actions/player'
import Message from './Message.vue'

const player = computed(() => state.player)

import i18nConfig from '../config/i18n_config.json'

const positionMap = i18nConfig.equipment_position
const statNameMap = i18nConfig.combat_stats

const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')
const showButton = ref(false)
const buttonText = ref('确定')
const onAction = ref(() => {})

const handleAction = () => {
  onAction.value()
}

const showEquipmentInfo = (item) => {
  let info = `${item.name}<br>`
  for (const [key, value] of Object.entries(item.combat_info || {})) {
    info += `${statNameMap[key] || key}: ${value}<br>`
  }
  messageContent.value = info.trim()
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = false
}

onMounted(async () => {
  await generateCombatStats()
})
</script>

<style scoped>
.character-view {
  background-color: #2a2a2a;
  text-align: center;
  color: #fff;
  width: 100vw;
  height: 100%;
  box-sizing: border-box;
  max-width: 100vw;
  overflow-x: hidden;
  padding: 20px 0;
}

.stats {
  margin-bottom: 20px;
  color: #fff;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #3a3a3a;
  border-radius: 4px;
}

.stat-label {
  font-weight: bold;
}

.equipment-section {
  margin-top: 20px;
  color: #fff;
}

.equipment-list {
  list-style: none;
  padding: 0;
}

.equipment-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #3a3a3a;
  border-radius: 4px;
}

.equipment-position {
  font-weight: bold;
  color: #fff;
}

.equipment-position {
  color: #888;
  margin-right: 8px;
}

.equipment-name {
  color: #fff;
}
</style>
