<template>
  <div class="bag-container">
    <div class="section-title">材料</div>
    <div v-if="materialsLoading" class="loading">加载中...</div>
    <div v-else class="materials-grid">
      <div
        v-for="material in materials"
        :key="material._id"
        class="material-item"
        @click="showMaterialInfo(material)"
      >
        <div class="material-name">{{ material.name }}</div>
      </div>
    </div>

    <div class="section-title">药品</div>
    <div v-if="potionsLoading" class="loading">加载中...</div>
    <div v-else class="potions-grid">
      <div
        v-for="potion in potions"
        :key="potion._id"
        class="potion-item"
        @click="showPotionInfo(potion)"
      >
        <div class="potion-name">{{ potion.name }}</div>
      </div>
    </div>

    <div class="section-title">未穿戴装备</div>
    <div class="unequipped-grid">
      <div
        v-for="item in unequippedItems"
        :key="item.name"
        class="unequipped-item"
        @click="showEquipmentInfo(item)"
      >
        <div class="item-name" :style="{ color: getEquipmentColor(item?.level || 1) }">{{ item.name }}</div>
      </div>
    </div>

    <Message
      v-model:visible="showMessage"
      :content="messageContent"
      :type="messageType"
      :show-button="showButton"
      :button-text="buttonText"
      @action="handleAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { state, updatePlayer, loadMaterials, loadPotions } from '../store/state'
import { equipItem } from '../store/actions/player'
import { materialApi, playerApi } from '../api'
import type { Material, Potion, Equipment } from '../api'
import Message from './Message.vue'
import i18nConfig from '../config/i18n_config.json'

interface MaterialDetails {
  name: string
  level: number
  type: string
  stats: string
}

interface PotionDetails {
  name: string
  description: string
  stats: string
}

const materials = ref<Material[]>([])
const potions = ref<Potion[]>([])

const materialsLoading = ref(false)
const potionsLoading = ref(false)

const loadPlayerMaterials = async () => {
  if (!state.player?.inventory?.materials?.length) {
    return
  }
  
  materialsLoading.value = true
  try {
    await loadMaterials(state.player.inventory.materials)
    const materialsList = state.player?.inventory?.materials || []
    materials.value = materialsList.map(id => state.materials[id]).filter(Boolean)
  } catch (error) {
    console.error('加载材料详情失败:', error)
  } finally {
    materialsLoading.value = false
  }
}

const loadPlayerPotions = async () => {
  if (!state.player?.inventory?.potions?.length) {
    return
  }
  
  potionsLoading.value = true
  try {
    await loadPotions(state.player.inventory.potions)
    const potionsList = state.player?.inventory?.potions || []
    potions.value = potionsList.map(id => state.potions[id]).filter(Boolean)
  } catch (error) {
    console.error('加载药水详情失败:', error)
  } finally {
    potionsLoading.value = false
  }
}

onMounted(() => {
  loadPlayerMaterials()
  loadPlayerPotions()
})

const unequippedItems = computed(() => {
  return state.player.inventory.equipments || []
})

const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')

const statNameMap = i18nConfig.combat_stats

const getEquipmentColor = (level: number): string => {
  return i18nConfig.equipment_level[String(level) as keyof typeof i18nConfig.equipment_level].color
}

const getMaterialDetails = async (material: Material): Promise<MaterialDetails | null> => {
  if (!material) return null
  
  // 如果 state 中没有该材料的战斗属性，则从后端获取
  if (!state.materialCombatStats[material._id]) {
    try {
      const response = await materialApi.getCombatStats(material._id)
      if (response.success) {
        // 更新 state 中的缓存
        state.materialCombatStats[material._id] = response.data
      } else {
        console.error('获取材料战斗属性失败:', response.message)
        return null
      }
    } catch (error) {
      console.error('获取材料战斗属性失败:', error)
      return null
    }
  }

  let statsInfo = ''
  const combatStats = state.materialCombatStats[material._id]
  for (const [stat, value] of Object.entries(combatStats)) {
    statsInfo += `${statNameMap[stat as keyof typeof statNameMap] || stat}: ${value}<br>`
  }

  return {
    name: material.name,
    level: material.level,
    type: material.typeId.name,
    stats: statsInfo.trim(),
  }
}

const showMaterialInfo = async (material: Material) => {
  const details = await getMaterialDetails(material)
  if (details) {
    messageContent.value = `${details.name}<br>类型: ${details.type}<br>等级: ${details.level}<br>属性加成:<br>${details.stats}`
    messageType.value = 'info'
    showMessage.value = true
    showButton.value = false
  }
}

const getOptionDetails = (potion: Potion): PotionDetails => {
  const effect = potion.effect
  let statsInfo = `${statNameMap[effect.type as keyof typeof statNameMap] || effect.type} ${effect.value >= 0 ? '+' : ''}${effect.value}<br>`

  return {
    name: potion.name,
    description: potion.description,
    stats: statsInfo.trim(),
  }
}

const showPotionInfo = (potion: Potion) => {
  const details = getOptionDetails(potion)
  messageContent.value = `${details.name}<br>${details.description}<br>效果: ${details.stats}`
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '使用'
  const handleUse = () => usePotion(potion)
  onAction.value = handleUse
}

const usePotion = async (potion: Potion) => {
  try {
    const response = await playerApi.usePotion({
      playerId: state.player._id,
      potionId: potion._id
    })

    if (response.success) {
      // 从背包中移除药水，仅移除一份
      const potionIndex = potions.value.findIndex(item => item._id === potion._id)
      if (potionIndex !== -1) {
        potions.value.splice(potionIndex, 1)
      }
      const index = state.player.inventory.potions.findIndex(id => id === potion._id)
      if (index !== -1) {
        state.player.inventory.potions.splice(index, 1)
      }

      updatePlayer({
        ...state.player,
        hp: response.data,
        inventory: {
          ...state.player.inventory,
          potions: state.player.inventory.potions
        }
      })
    } else {
      console.error('使用药水失败:', response.message)
    }
  } catch (error) {
    console.error('使用药水失败:', error)
  }
}

const showEquipmentInfo = (item: Equipment) => {
  let info = `${item.name}<br>`
  for (const [key, value] of Object.entries(item.combatStats || {})) {
    if (statNameMap[key as keyof typeof statNameMap] && value > 0) {
      info += `${statNameMap[key as keyof typeof statNameMap]}: ${value}<br>`
    }
  }
  messageContent.value = info.trim()
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '穿戴'
  const handleEquip = () => equipItem(item.id)
  onAction.value = handleEquip
}

const showButton = ref(false)
const buttonText = ref('确定')
const onAction = ref<() => void>(() => {})

const handleAction = () => {
  onAction.value()
}
</script>

<style scoped>
.bag-container {
  height: 100%;
  background-color: #2a2a2a;
  color: white;
  overflow-y: auto;
}

.section-title {
  margin: 10px 0;
  color: #ffd700;
  font-size: 16px;
  font-weight: 500;
}

.materials-grid,
.potions-grid,
.unequipped-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 10px;
}

.material-item,
.potion-item,
.unequipped-item {
  background-color: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.material-item:hover,
.potion-item:hover,
.unequipped-item:hover {
  transform: scale(1.05);
  border-color: #ffd700;
}

.material-name,
.potion-name,
.item-name {
  font-size: 16px;
}

.combat-info {
  font-size: 14px;
  color: #aaa;
}

.stat {
  margin: 4px 0;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #aaa;
}
</style>
