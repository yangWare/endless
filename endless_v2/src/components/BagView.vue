<template>
  <div class="bag-container">
    <div class="section-title">材料</div>
    <div class="materials-grid">
      <div
        v-for="material in materials"
        :key="material.id"
        class="material-item"
        @click="showMaterialInfo(material)"
      >
        <div class="material-name">{{ material.name }}</div>
      </div>
    </div>

    <div class="section-title">药品</div>
    <div class="potions-grid">
      <div
        v-for="potion in potions"
        :key="potion.id"
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
        <div class="item-name">{{ item.name }}</div>
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

<script setup>
import { computed, ref } from 'vue'
import { state, updatePlayer } from '../store/state'
import { equipItem, calculateMaxHp } from '../store/actions/player'
import materialConfig from '../config/material_config.json'
import potionConfig from '../config/potion_config.json'
import Message from './Message.vue'

const getMaterialName = (materialKey) => {
  for (const typeKey in materialConfig.material_types) {
    const type = materialConfig.material_types[typeKey]
    if (type.materials[materialKey]) {
      return type.materials[materialKey].name
    }
  }
  return materialKey
}

const materials = computed(() => {
  const materialsList = state.player.materials || []
  return materialsList.map((key) => ({
    id: key,
    name: getMaterialName(key),
  }))
})

const potions = computed(() => {
  const potionsList = state.player.potions || []
  return potionsList.map((potionId) => {
    const potion = potionConfig.potions[potionId]
    return {
      id: potionId,
      name: potion.name,
      description: potion.description,
      effect: potion.effect
    }
  })
})

const unequippedItems = computed(() => {
  return state.player.unequipped || []
})

const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')

import i18nConfig from '../config/i18n_config.json'

const statNameMap = i18nConfig.combat_stats

const getMaterialDetails = (materialKey) => {
  for (const typeKey in materialConfig.material_types) {
    const type = materialConfig.material_types[typeKey]
    if (type.materials[materialKey]) {
      const material = type.materials[materialKey]
      const baseStats = type.base_stats
      const multiplier = material.multiplier

      let statsInfo = ''
      for (const [stat, value] of Object.entries(baseStats)) {
        statsInfo += `${statNameMap[stat] || stat}: ${value * multiplier}<br>`
      }

      return {
        name: material.name,
        level: material.level,
        type: type.name,
        stats: statsInfo.trim(),
      }
    }
  }
  return null
}

const showMaterialInfo = (material) => {
  const details = getMaterialDetails(material.id)
  if (details) {
    messageContent.value = `${details.name}<br>类型: ${details.type}<br>等级: ${details.level}<br>属性加成:<br>${details.stats}`
    messageType.value = 'info'
    showMessage.value = true
    showButton.value = false
  }
}

const showPotionInfo = (potion) => {
  messageContent.value = `${potion.name}<br>${potion.description}<br>效果: ${potion.effect.type === 'hp' ? '恢复生命值' : potion.effect.type} ${potion.effect.value}`
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '使用'
  const handleUse = () => usePotion(potion)
  onAction.value = handleUse
}

const usePotion = async (potion) => {
  // 从玩家背包中移除药水
  const potionsList = [...state.player.potions]
  const index = potionsList.indexOf(potion.id)
  if (index > -1) {
    potionsList.splice(index, 1)
  }
  
  // 应用药水效果
  let newHp = state.player.hp
  if (potion.effect.type === 'hp') {
    const maxHp = calculateMaxHp()
    newHp = Math.min(state.player.hp + potion.effect.value, maxHp)
  }
  
  // 更新状态
  await updatePlayer({
    ...state.player,
    hp: newHp,
    potions: potionsList
  })
}

const showEquipmentInfo = (item) => {
  let info = `${item.name}<br>`
  for (const [key, value] of Object.entries(item.combat_info || {})) {
    info += `${statNameMap[key] || key}: ${value}<br>`
  }
  messageContent.value = info.trim()
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '穿戴'
  const handleEquip = () => equipItem(item.name)
  onAction.value = handleEquip
}

const showButton = ref(false)
const buttonText = ref('确定')
const onAction = ref(() => {})

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
</style>
