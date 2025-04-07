<template>
  <div>
    <div class="overlay" @click="closeLocationView"></div>
    <div class="location-container">
      <div class="content-wrapper">
        <div class="location-header">
          <div class="location-title">{{ location.name }}</div>
        </div>

        <div class="combat-log">
          <div class="section-title">探索日志</div>
          <div class="combat-log-content">
            <div v-for="log in combatLogs" :key="log.id">
              {{ log.message }}
            </div>
          </div>
        </div>

        <!-- Tab切换 -->
        <div class="tab-container" v-if="showEnemiesTab || hasNpcs">
          <div
            v-if="showEnemiesTab"
            class="tab-item"
            :class="{ active: activeTab === 'enemies' }"
            @click="activeTab = 'enemies'"
          >
            生物列表
          </div>
          <div
            v-if="hasNpcs"
            class="tab-item"
            :class="{ active: activeTab === 'npcs' }"
            @click="activeTab = 'npcs'"
          >
            NPC列表
          </div>
        </div>

        <div class="enemies-list" v-if="activeTab === 'enemies'">
          <div v-if="hasEnemies" class="enemies-list-content">
            <div
              v-for="enemy in locationEnemies"
              :key="enemy.instanceId"
              class="enemy-item"
              @click="showEnemyInfo(enemy)"
            >
              <span>{{ enemy.name }} (HP: {{ enemy.enemy.hp }})</span>
              <button @click.stop="handleAttackEnemy(enemy)" :disabled="isAttacking">
                攻击
              </button>
            </div>
          </div>
          <div v-else class="empty-enemies">
            <span class="explore-button" @click="updateLocationEnemies">
              继续探索
            </span>
          </div>
        </div>

        <!-- NPC列表 -->
        <div class="npcs-list" v-if="activeTab === 'npcs' && location.npc && hasNpcs">
          <div class="npcs-list-content">
            <div
              v-for="key in npcs"
              :key="key"
              class="npc-item"
              @click="handleNpcClick(key)"
            >
              <span>{{ getNpcName(key) }}</span>
              <button v-if="key === 'forge' || key === 'shop'" class="enter-button">进入</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ForgeView v-if="showForge" class="npc-view" @close="closeForge" />
    <ShopView v-if="showShop" class="npc-view" @close="closeShop" />
    <Message
      v-model:visible="showEnemyInfoModal"
      :content="enemyInfoContent"
      type="info"
      :show-button="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, onMounted, watch, nextTick } from 'vue'
import type { EnemyInstance } from '../api'
import { state } from '../store/state'
import {  generateEnemyCombatStats, generateEnemies } from '../store/actions/enemy'
import { attackEnemy } from '../store/actions/player'
import materialConfig from '../config/material_config.json'
import i18nConfig from '../config/i18n_config.json'
import ForgeView from './ForgeView.vue'
import ShopView from './ShopView.vue'
import Message from './Message.vue'

interface CombatLog {
  id: number
  message: string
}

interface Enemy {
  instanceId: string
  name: string
  enemy: EnemyInstance
}

interface DroppedItem {
  id: string
  quantity: number
}

interface CombatResult {
  player: {
    hit: boolean
    damage: number
    isCrit: boolean
  }
  enemy?: {
    hit: boolean
    damage: number
    isCrit: boolean
    isPlayerAlive: boolean
  }
  droppedItems?: DroppedItem[]
}

const activeTab = ref<'enemies' | 'npcs' | null>('enemies')
const locationEnemies = ref<Enemy[]>([])
const combatLogs = ref<CombatLog[]>([])
const isAttacking = ref(false)
const showForge = ref(false)
const showShop = ref(false)
const showEnemyInfoModal = ref(false)
const enemyInfoContent = ref('')

const location = computed(() => state.mapLocations[state.currentLocationId])

const emit = defineEmits<{
  (e: 'close'): void
}>()
const closeLocationView = (): void => {
  emit('close')
}

const ensureValidTab = (): void => {
  if (activeTab.value === 'enemies' && !showEnemiesTab.value) {
    activeTab.value = hasNpcs.value ? 'npcs' : null
  } else if (activeTab.value === 'npcs' && !hasNpcs.value) {
    activeTab.value = showEnemiesTab.value ? 'enemies' : null
  }
}

const updateLocationEnemies = (): void => {
  const currentLocationEnemies = state.enemyInstances
  const possibleEnemies = Object.entries(currentLocationEnemies)
    .filter(([_, enemy]) => {
      const creatureId = enemy.creatureId
      const enemyConfigOfLocation = location.value.enemies.find((enemy) => enemy.creatureId._id === creatureId)
      if (!enemyConfigOfLocation) return false
      
      return Math.random() < enemyConfigOfLocation.probability
    })
    .map(([instanceId, enemy]) => {
      const creatureId = enemy.creatureId
      const enemyConfigOfLocation = location.value.enemies.find((enemy) => enemy.creatureId._id === creatureId)
      return {
        instanceId,
        name: enemyConfigOfLocation?.creatureId.name || '异常生物',
        enemy,
      }
    })
  
  const maxEnemies = Math.min(5, possibleEnemies.length)
  locationEnemies.value = possibleEnemies
    .sort(() => Math.random() - 0.5)
    .slice(0, maxEnemies)
}

onMounted(async () => {
  combatLogs.value.push({
    id: Date.now(),
    message: `${location.value.description || ''}`,
  })
  ensureValidTab()
  generateEnemies().then(() => {
    updateLocationEnemies()
  })
})

const npcs = computed(() => {
  const list: string[] = []
  Object.keys(location.value.npc).forEach((key) => {
    if (!location.value.npc.hasOwnProperty(key)) {
      return
    }
    if (key === '_id') return
    const value = location.value.npc[key as keyof typeof location.value.npc]
    if (value) {
      list.push(key)
    }
  })
  return list
})

const getNpcName = (npcType: string): string => {
  const npcNames: Record<string, string> = {
    forge: '锻造所',
    shop: '商店',
  }
  return npcNames[npcType] || npcType
}

const hasNpcs = computed((): boolean => {
  return npcs.value.length > 0
})

const handleNpcClick = (npcType: string): void => {
  if (npcType === 'forge') {
    showForge.value = true
  } else if (npcType === 'shop') {
    showShop.value = true
  }
}

const closeForge = (): void => {
  showForge.value = false
}

const closeShop = (): void => {
  showShop.value = false
}

const addMessageWithDelay = (message: string, delay = 500): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      combatLogs.value.push({
        id: Date.now(),
        message,
      })
      resolve()
    }, delay)
  })
}

const scrollToBottom = (): void => {
  nextTick(() => {
    const container = document.querySelector('.combat-log-content')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

watch(combatLogs, scrollToBottom, { deep: true })

const handleAttackEnemy = async (enemy: Enemy): Promise<void> => {
  if (isAttacking.value) return
  isAttacking.value = true
  try {
    const result = await attackEnemy(enemy.instanceId) as CombatResult

    if (!result.player.hit) {
      await addMessageWithDelay(`你的攻击未命中${enemy.name}`)
    } else {
      let message = `你对${enemy.name}造成了${result.player.damage}点伤害`
      if (result.player.isCrit) {
        message += '（暴击！）'
      }
      await addMessageWithDelay(message)
      if (!state.enemyStatus[state.currentLocationId]?.[enemy.instanceId]) {
        await addMessageWithDelay(`${enemy.name}被击败了！`)
        if (result.droppedItems && result.droppedItems.length > 0) {
          const dropsMessage = result.droppedItems
            .map((drop) => {
              for (const typeKey in materialConfig.material_types) {
                const type = materialConfig.material_types[typeKey]
                if (type.materials[drop.id]) {
                  return type.materials[drop.id].name
                }
              }
              return drop.id
            })
            .join('、')
          await addMessageWithDelay(`获得了：${dropsMessage}`)
        }
        updateLocationEnemies()
        return
      }
    }

    if (result.enemy) {
      if (!result.enemy.hit) {
        await addMessageWithDelay(`${enemy.name}的反击未命中你`)
      } else {
        let counterMessage = `${enemy.name}反击对你造成了${result.enemy.damage}点伤害`
        if (result.enemy.isCrit) {
          counterMessage += '（暴击！）'
        }
        await addMessageWithDelay(counterMessage)

        if (!result.enemy.isPlayerAlive) {
          await addMessageWithDelay('你被击败了，装备材料掉了一地，太可惜了')
          return
        }
      }
    }
  } catch (error) {
    console.error('Attack failed:', error)
    await addMessageWithDelay('你脚下一滑，攻击没有发起')
  } finally {
    isAttacking.value = false
  }
}

const hasEnemies = computed((): boolean => {
  return locationEnemies.value.length > 0
})

const showEnemiesTab = computed((): boolean => {
  return location.value.enemies && location.value.enemies.length > 0
})

const showEnemyInfo = (enemy: Enemy): void => {
  const creatureId = enemy.enemy.enemyId
  const stats = generateEnemyCombatStats(creatureId)
  
  let content = `${enemy.name}<br>`
  for (const [key, value] of Object.entries(stats)) {
    content += `${i18nConfig.combat_stats[key]}: ${value}<br>`
  }
  enemyInfoContent.value = content.trim()
  showEnemyInfoModal.value = true
}

const closeEnemyInfo = (): void => {
  showEnemyInfoModal.value = false
  enemyInfoContent.value = ''
}
</script>

<style scoped>
.location-container {
  position: fixed;
  top: 100%;
  left: 0;
  right: 0;
  bottom: 64px;
  padding: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1000;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  animation: slideUp 0.3s ease-out forwards;
}

/* 添加ForgeView和ShopView的容器样式 */
.npc-view {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  bottom: 64px;
  z-index: 1100;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content-wrapper {
  background: transparent;
  padding: 6px;
  height: 100%;
  overflow-y: auto;
}

.overlay {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  bottom: 64px;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  cursor: pointer;
}

@keyframes slideUp {
  from {
    top: 100%;
  }
  to {
    top: 100px;
  }
}

.location-header {
  margin-bottom: 10px;
}

.location-title {
  font-weight: bold;
  padding: 6px 0;
}

.combat-log {
  height: 200px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  scroll-behavior: smooth;
}

.combat-log div {
  margin: 2px 0;
  color: #333;
  text-shadow:
    0 0 4px rgba(255, 255, 255, 0.8),
    1px 1px 2px rgba(0, 0, 0, 0.3);
}

.combat-log .combat-log-content {
  height: calc(100% - 40px);
  overflow-y: auto;
  margin: 4px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.combat-log .combat-log-content::-webkit-scrollbar {
  display: none;
}

.enemies-list {
  margin-bottom: 20px;
}

.enemies-list-content {
  max-height: calc(100vh - 500px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 4px 0;
}

.enemies-list-content::-webkit-scrollbar {
  display: none;
}

.tab-container {
  display: flex;
  margin-bottom: 10px;
}

.tab-item {
  padding: 0;
  margin: 0 8px;
  cursor: pointer;
  font-weight: 500;
  font: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #ff6b35;
  border-bottom-color: #ff6b35;
}

.enemy-item,
.npc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  border-bottom: 1px solid #ccc;
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.npc-item:hover {
  background-color: rgba(255, 107, 53, 0.1);
}

.section-title {
  font-weight: bold;
  padding: 4px 0;
}

.enemy-item button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.enemy-item button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 71, 87, 0.4);
  background: linear-gradient(135deg, #ff4757, #ff6b6b);
}

.npc-item .enter-button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #8b0000, #a52a2a);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(139, 0, 0, 0.3);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.npc-item .enter-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 0, 0, 0.4);
  background: linear-gradient(135deg, #a52a2a, #8b0000);
}

.npc-item .enter-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(139, 0, 0, 0.2);
}

.enemy-item button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(255, 71, 87, 0.2);
}

.enemy-stats,
.stat-item,
.stat-label,
.stat-value {
  display: none;
}

.empty-enemies {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  padding: 10px;
}

.explore-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  border: none;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.explore-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.3s;
}

.explore-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.4);
}

.explore-button:hover::before {
  left: 100%;
}

.explore-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(139, 69, 19, 0.2);
}

.explore-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.explore-button:disabled::before {
  display: none;
}
</style>
