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
          <div v-if="isPlayerDead" class="empty-enemies">
            <span class="revive-button" @click="handleRevive">
              复活
            </span>
          </div>
          <div v-else class="enemies-container">
            <div v-if="hasEnemies" class="enemies-list-content">
              <div
                v-for="enemy in locationEnemies"
                :key="enemy.instanceId"
                class="enemy-item"
                @click="showEnemyInfo(enemy)"
              >
                <span>
                  {{ enemy.name }}
                  <span v-if="getEnemyLevelTag(enemy)" :class="['level-tag', getEnemyLevelTag(enemy).toLowerCase()]">
                    {{ getEnemyLevelTag(enemy) }}
                  </span>
                  (HP: {{ enemy.enemy.hp }})
                </span>
                <button @click.stop="handleAttackEnemy(enemy)" :disabled="isAttacking">
                  攻击
                </button>
              </div>
            </div>
            <div class="explore-button-container">
              <span v-if="!isAttackStatus" class="explore-button" @click="handleExplore()" :class="{ 'with-enemies': hasEnemies }">
                继续探索
              </span>
              <span v-else class="explore-button" @click="handleEscape()" :class="{ 'with-enemies': hasEnemies }">脱战</span>
            </div>
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
            <div
              class="npc-item"
              @click="handleNpcClick('tavern')"
            >
              <span>{{ getNpcName('tavern') }}</span>
              <button class="enter-button">进入</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ForgeView v-if="showForge" class="npc-view" @close="closeForge" />
    <ShopView v-if="showShop" class="npc-view" @close="closeShop" />
    <TavernView v-if="showTavern" class="npc-view" @close="closeTavern"></TavernView>
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
import type { AttackEnemyResult, EnemyInstance } from '../api'
import { state, updatePlayer, updateLocationEnemies, clearLocationEnemies } from '../store/state'
import {  generateEnemyCombatStats, generateEnemies } from '../store/actions/enemy'
import { attackEnemy } from '../store/actions/player'
import { playerApi } from '../api'
import i18nConfig from '../config/i18n_config.json'
import ForgeView from './ForgeView.vue'
import ShopView from './ShopView.vue'
import TavernView from './TavernView.vue'
import Message from './Message.vue'
import { updateCurrentMap } from '../store/state'
import { updateCurrentLocation } from '../store/state'

interface CombatLog {
  id: number
  message: string
}

interface Enemy {
  instanceId: string
  name: string
  enemy: EnemyInstance
}

const activeTab = ref<'enemies' | 'npcs' | null>('enemies')
const combatLogs = ref<CombatLog[]>([])
const isAttacking = ref(false)
const showForge = ref(false)
const showShop = ref(false)
const showTavern = ref(false)
const showEnemyInfoModal = ref(false)
const enemyInfoContent = ref('')

const location = computed(() => state.mapLocations[state.currentLocationId])
const locationEnemies = computed(() => state.locationEnemies)

// 是否处于战斗状态
const isAttackStatus = ref(false)

const emit = defineEmits<{
  (e: 'close'): void
}>()
const closeLocationView = (): void => {
  if (isAttackStatus.value) {
    addMessageWithDelay('当前处于战斗状态，无法离开')
    return
  }
  emit('close')
}

const ensureValidTab = (): void => {
  if (activeTab.value === 'enemies' && !showEnemiesTab.value) {
    activeTab.value = hasNpcs.value ? 'npcs' : null
  } else if (activeTab.value === 'npcs' && !hasNpcs.value) {
    activeTab.value = showEnemiesTab.value ? 'enemies' : null
  }
}

onMounted(async () => {
  combatLogs.value.push({
    id: Date.now(),
    message: `${location.value.description || ''}`,
  })
  ensureValidTab()
  handleInitExplore()
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
    tavern: "酒馆"
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
  } else if (npcType === 'tavern') {
    showTavern.value = true
  }
}

const closeForge = (): void => {
  showForge.value = false
}

const closeShop = (): void => {
  showShop.value = false
}

const closeTavern = () => {
  showTavern.value = false
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

const handleAttackMainEnemyRes = async (enemy: Enemy, mainEnemyRes: AttackEnemyResult[string]) => {
  // 主攻击敌人不存在，说明敌人已被其他玩家击杀
  if (!mainEnemyRes) {
    await addMessageWithDelay(`${enemy.name}已被其他玩家击杀`)
    // 立刻更新，提高体验
    const currentEnemies = state.locationEnemies.filter(e => e.instanceId !== enemy.instanceId)
    updateLocationEnemies(currentEnemies)
    return false
  }

  if (!mainEnemyRes.damage) {
    await addMessageWithDelay(`你的攻击未命中${enemy.name}`)
  } else {
    let message = `你对${enemy.name}造成了${mainEnemyRes.damage}点伤害`
    if (mainEnemyRes.isCritical) {
      message += '（暴击！）'
    }
    await addMessageWithDelay(message)
    enemy.enemy.hp = mainEnemyRes.remainingHp
  }

  if (mainEnemyRes.result === 'enemy_flee') {
    await addMessageWithDelay(`${enemy.name}惊慌失措，一溜烟逃跑了`)
    const currentEnemies = state.locationEnemies.filter(e => e.instanceId !== enemy.instanceId)
    updateLocationEnemies(currentEnemies)
    return false
  }

  if (mainEnemyRes.result === 'enemy_dead') {
    await addMessageWithDelay(`${enemy.name}已被你击杀！`)
    const currentEnemies = state.locationEnemies.filter(e => e.instanceId !== enemy.instanceId)
    updateLocationEnemies(currentEnemies)
    if (mainEnemyRes.droppedMaterials && mainEnemyRes.droppedMaterials.length > 0) {
      const dropsMessage = mainEnemyRes.droppedMaterials
        .map((drop) => {
          return drop.materialId.name
        })
        .join('、')
      await addMessageWithDelay(`获得了：${dropsMessage}`)
      // 材料加入玩家背包
      const newPlayer = { ...state.player }
      newPlayer.inventory.materials = [...newPlayer.inventory.materials, ...mainEnemyRes.droppedMaterials.map(m => m.materialId._id)]
      updatePlayer(newPlayer)
    }
    return false
  }

  if (!mainEnemyRes.counterDamage) {
    await addMessageWithDelay(`${enemy.name}的反击未命中你`)
  } else {
    let counterMessage = `${enemy.name}反击对你造成了${mainEnemyRes.counterDamage}点伤害`
    if (mainEnemyRes.isCounterCritical) {
      counterMessage += '（暴击！）'
    }
    // 材料加入玩家背包
    const newPlayer = { ...state.player }
    newPlayer.hp = Math.max(0, newPlayer.hp - mainEnemyRes.counterDamage)
    updatePlayer(newPlayer)
    await addMessageWithDelay(counterMessage)
    if (state.player.hp === 0) {
      await addMessageWithDelay('你被击败了，装备材料掉了一地，太可惜了')
    }
  }
  return true
}
const handleOtherEnemyAttackRes = async (enemyId: string, res: AttackEnemyResult) => {
  // 上一次战斗中敌人列表
  const prevFightEnemies = state.player.fightingEnemies
  // 新的战斗中敌人列表
  const newFightingEnemies: string[] = []
  // 新的敌人列表
  const newLocationEnemies: typeof state.locationEnemies = []
  // 处理其他主动攻击的敌人
  for (const instanceId in res) {
    const otherEnemyRes = res[instanceId]

    // 处理战斗中敌人列表
    // 被锁定，则取上一次战斗结果
    if (otherEnemyRes.result === 'enemy_lock_by_other') {
      const prevEnemyId = prevFightEnemies.find(id => id === instanceId)
      if (prevEnemyId) {
        newFightingEnemies.push(prevEnemyId)
      }
    } else if (['continue', 'active_attack'].includes(otherEnemyRes.result)) {
      newFightingEnemies.push(instanceId)
    }

    if (otherEnemyRes.remainingHp > 0) {
      newLocationEnemies.push({
        instanceId: otherEnemyRes.enemyInstance._id,
        name: otherEnemyRes.enemyInstance.creatureId.name,
        enemy: {
          ...otherEnemyRes.enemyInstance,
          hp: otherEnemyRes.remainingHp
        }
      })
    }
    if (instanceId === enemyId) {
      continue
    }
    if (otherEnemyRes.result !== 'active_attack') {
      continue
    }
    const otherEnemyName = otherEnemyRes.enemyInstance.creatureId.name
    if (!otherEnemyRes.counterDamage) {
      await addMessageWithDelay(`附近的${otherEnemyName}主动发起攻击，但未命中你`)
    } else {
      let counterMessage = `附近的${otherEnemyName}主动发起攻击，对你造成了${otherEnemyRes.counterDamage}点伤害`
      if (otherEnemyRes.isCounterCritical) {
        counterMessage += '（暴击！）'
      }
      // 材料加入玩家背包
      const newPlayer = { ...state.player }
      newPlayer.hp = Math.max(0, newPlayer.hp - otherEnemyRes.counterDamage)
      updatePlayer(newPlayer)
      await addMessageWithDelay(counterMessage)
      if (state.player.hp === 0) {
        await addMessageWithDelay('你被击败了，装备材料掉了一地，太可惜了')
        return
      }
    }
  }
  const newPlayer = { ...state.player }
  newPlayer.fightingEnemies = newFightingEnemies
  updatePlayer(newPlayer)
  isAttackStatus.value = newFightingEnemies.length > 0
  // 整体更新一波列表
  updateLocationEnemies(newLocationEnemies.sort((prev, next) => {
    return prev.instanceId > next.instanceId ? -1 : 1
  }))
}
const handleAttackEnemy = async (enemy: Enemy): Promise<void> => {
  if (isAttacking.value) return
  isAttacking.value = true
  try {
    const res = await attackEnemy(0, enemy.instanceId)
    const mainEnemyRes = res[enemy.instanceId]
    await handleAttackMainEnemyRes(enemy, mainEnemyRes)
    await handleOtherEnemyAttackRes(enemy.instanceId, res)
  } catch (error) {
    console.error('Attack failed:', error)
    await addMessageWithDelay('你脚下一滑，攻击没有发起')
  } finally {
    isAttacking.value = false
  }
}

const hasEnemies = computed((): boolean => {
  return state.locationEnemies.length > 0
})

const showEnemiesTab = computed((): boolean => {
  return location.value.enemies && location.value.enemies.length > 0
})

const showEnemyInfo = async (enemy: Enemy): Promise<void> => {
  showEnemyInfoModal.value = true
  enemyInfoContent.value = '加载中...'
  const stats = await generateEnemyCombatStats(enemy.instanceId)
  
  let content = `${enemy.name}<br>`
  for (const [key, value] of Object.entries(stats)) {
    content += `${i18nConfig.combat_stats[key as keyof typeof i18nConfig.combat_stats]}: ${value}<br>`
  }
  enemyInfoContent.value = content.trim()
}

const isPlayerDead = computed(() => {
  if (!state.player) return false
  return state.player.hp <= 0
})

const handleRevive = async (): Promise<void> => {
  try {
    const response = await playerApi.revive({ playerId: state.player?._id || '' })
    if (response.success) {
      updatePlayer(response.data)
      updateCurrentMap(response.data.currentMap)
      updateCurrentLocation(response.data.currentLocation)
      clearLocationEnemies()
      isAttackStatus.value = false
      closeLocationView()
    } else {
      await addMessageWithDelay('复活失败，请稍后再试')
    }
  } catch (error) {
    console.error('Revive failed:', error)
    await addMessageWithDelay('复活失败，请稍后再试')
  }
}

const handleEscape = async () => {
  try {
    const response = await playerApi.escape({ playerId: state.player?._id || '' })
    if (response.data.canEscape) {
      isAttackStatus.value = false
      const newPlayer = { ...state.player }
      newPlayer.fightingEnemies = []
      updatePlayer(newPlayer)
      addMessageWithDelay('你已脱战')
    } else {
      addMessageWithDelay('敌人遁速较高，你无法脱战')
    }
  } catch (error) {
    console.error('Revive failed:', error)
    await addMessageWithDelay('脱战失败，请稍后再试')
  }
}

const handleInitExplore = async (): Promise<void> => {
  // 和攻击动作互斥
  if (isAttacking.value) return
  isAttacking.value = true

  await addMessageWithDelay(`你开始向前探索，发现前方似乎有动静，你谨慎的摸了过去...`)

  try {
    // 根据缓存数据判断当前是否处于战斗状态
    const attackEnemyList = state.player.fightingEnemies
    // 处于战斗状态，则只获取生物列表，不处于，则要重新判断
    // 如果=敌人列表不为空，则可能处于战斗状态，需获取列表进行判断
    if (attackEnemyList.length > 0) {
      await generateEnemies(0)
      if (locationEnemies.value.length === 0) {
        await addMessageWithDelay('虚惊一场，什么都没有，继续探索吧')
        return
      }
      attackEnemyList.forEach(id => {
        const instance = locationEnemies.value.find(item => item.instanceId === id)
        // 任意一个敌人还在敌人列表里，则认为处于战斗状态
        if (instance) {
          isAttackStatus.value = true
        }
      })
    }

    // 处于非战斗状态，则立刻进行一次模拟攻击，刷新战斗状态
    if (!isAttackStatus.value) {
      // 模拟攻击，实际是为了实现敌人主动攻击效果
      const res = await attackEnemy(0)
      await handleOtherEnemyAttackRes('', res)
    }

    if (locationEnemies.value.length === 0) {
      await addMessageWithDelay('虚惊一场，什么都没有，继续探索吧')
    } else {
      await addMessageWithDelay('发现敌对生物，准备战斗吧')
    }
  } catch (error) {
    console.error('explore failed:', error)
    await addMessageWithDelay('你好像遇到了某种神秘的阻碍，又回到了原点')
  } finally {
    isAttacking.value = false
  }
}
const handleExplore = async (): Promise<void> => {
  // 和攻击动作互斥
  if (isAttacking.value) return
  isAttacking.value = true

  await addMessageWithDelay(`你继续向前探索，发现前方似乎有动静，你谨慎的摸了过去...`)

  try {
    // 模拟攻击，实际是为了实现敌人主动攻击效果
    const res = await attackEnemy(1)
    await handleOtherEnemyAttackRes('', res)
    if (state.locationEnemies.length === 0) {
      await addMessageWithDelay('虚惊一场，什么都没有，继续探索吧')
    } else {
      await addMessageWithDelay('发现敌对生物，准备战斗吧')
    }
  } catch (error) {
    console.error('explore failed:', error)
    await addMessageWithDelay('你好像遇到了某种神秘的阻碍，又回到了原点')
  } finally {
    isAttacking.value = false
  }
}

const getEnemyLevelTag = (enemy: Enemy): string => {
  const level = enemy.enemy.level || 1
  if (level >= 5) return 'Boss'
  if (level >= 3) return '精英'
  return ''
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

.enemies-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.enemies-list-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 4px 0;
  padding-bottom: 16px;
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

.explore-button-container {
  display: flex;
  justify-content: center;
  position: sticky;
  bottom: 12px;
  z-index: 1;
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

.explore-button.with-enemies {
  background: linear-gradient(135deg, #A0522D, #8B4513);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.4);
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

.revive-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  border: none;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.revive-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
  background: linear-gradient(135deg, #ff4757, #ff6b6b);
}

.revive-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(255, 71, 87, 0.2);
}

.level-tag {
  display: inline-block;
  padding: 2px 6px;
  margin-left: 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.level-tag.精英 {
  background: linear-gradient(135deg, #ffa502, #ff7f50);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.level-tag.boss {
  background: linear-gradient(135deg, #ff0000, #8b0000);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  animation: boss-glow 2s infinite;
}

@keyframes boss-glow {
  0% {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
  }
}
</style>
