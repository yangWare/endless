<template>
  <div class="forge-view-container">
    <div class="forge-view">
      <div class="forge-header">
        <div class="forge-title">装备锻造</div>
        <button class="close-button" @click.stop="handleCloseClick">×</button>
      </div>

      <!-- 装备类型选择 -->
      <div class="equipment-type-selection">
        <div class="section-title">选择装备类型</div>
        <div class="equipment-types">
          <div
            v-for="(type, key) in equipmentTypes"
            :key="key"
            class="equipment-type-item"
            :class="{ selected: selectedType === key }"
            @click="selectEquipmentType(key)"
          >
            {{ type.name }}
          </div>
        </div>
      </div>

      <!-- 材料选择区域 -->
      <div class="materials-selection">
        <div class="section-title">选择材料 (1-5件)</div>
        <div class="materials-list">
          <div
            v-for="(material, index) in availableMaterials"
            :key="index"
            class="material-item"
            :class="{
              selected: selectedMaterials.some((item) => item.index === index),
            }"
            @click="toggleMaterial(material, index)"
          >
            {{ getMaterialName(material) }}
          </div>
        </div>
      </div>

      <!-- 已选材料展示 -->
      <div class="selected-materials" v-if="selectedMaterials.length > 0">
        <div class="section-title">已选材料</div>
        <div class="selected-list">
          <div
            v-for="(item, idx) in selectedMaterials"
            :key="idx"
            class="selected-item"
          >
            {{ getMaterialName(item.material) }}
            <button @click="removeMaterial(item.index)">移除</button>
          </div>
        </div>
      </div>

      <!-- 锻造按钮 -->
      <button
        class="forge-button"
        @click="startForge"
        :disabled="selectedMaterials.length === 0 || selectedMaterials.length > 5"
      >
        开始锻造
      </button>

      <!-- 锻造结果提示 -->
      <div
        v-if="forgeResult"
        class="forge-result"
        :class="forgeResult.success ? 'success' : 'fail'"
      >
        <div class="section-title">锻造结果</div>
        <p>{{ forgeResult.message }}</p>
        <div v-if="forgeResult.equipment" class="equipment-stats">
          <p>获得装备：{{ forgeResult.equipment.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { state } from '../store/state'
import materialConfig from '../config/material_config.json'
import i18n from '../config/i18n_config.json'
import { forgeEquipment } from '../store/actions/forge'

export default {
  name: 'ForgeView',
  emits: ['close'],
  setup(props, { emit }) {
    const selectedMaterials = ref([])
    const selectedType = ref('')
    const forgeResult = ref(null)
    const isForging = ref(false)

    const equipmentTypes = i18n.equipment_position

    // 获取玩家当前拥有的材料
    const availableMaterials = computed(() => state.player.materials)

    // 监听材料列表变化
    watch(availableMaterials, () => {
      selectedMaterials.value = []
      selectedType.value = ''
    })

    // 获取材料显示名称
    const getMaterialName = (materialId) => {
      for (const type in materialConfig.material_types) {
        const materials = materialConfig.material_types[type].materials
        if (materials[materialId]) {
          return materials[materialId].name
        }
      }
      return materialId
    }

    // 切换材料选择状态
    const toggleMaterial = (material, index) => {
      const existingIndex = selectedMaterials.value.findIndex(
        (item) => item.index === index,
      )
      if (existingIndex !== -1) {
        removeMaterial(index)
      } else if (selectedMaterials.value.length < 5) {
        selectedMaterials.value.push({ material, index })
      }
    }

    // 移除已选材料
    const removeMaterial = (index) => {
      selectedMaterials.value = selectedMaterials.value.filter(
        (item) => item.index !== index,
      )
    }

    // 选择装备类型
    const selectEquipmentType = (type) => {
      selectedType.value = type
    }

    // 开始锻造
    const startForge = async () => {
      if (
        !selectedType.value ||
        selectedMaterials.value.length === 0 ||
        selectedMaterials.value.length > 5 ||
        isForging.value
      ) {
        return
      }

      isForging.value = true
      try {
        // 获取锻造师等级和工具等级
        const forgerLevel = state.player.forgerLevel || 1
        const toolLevel = state.player.toolLevel || 1

        // 调用forge.js中的锻造方法
        const result = await forgeEquipment({
          materials: selectedMaterials.value.map((item) => item.material),
          forgerLevel,
          toolLevel,
          equipmentType: selectedType.value,
        })

        forgeResult.value = result
        selectedMaterials.value = []
        selectedType.value = ''
      } finally {
        isForging.value = false
      }
    }

    const handleCloseClick = (event) => {
      // 检查点击是否在关闭区域内
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientY - rect.top < 100) {
        emit('close')
      }
    }

    return {
      availableMaterials,
      selectedMaterials,
      selectedType,
      equipmentTypes,
      forgeResult,
      getMaterialName,
      toggleMaterial,
      removeMaterial,
      selectEquipmentType,
      startForge,
      handleCloseClick,
    }
  },
}
</script>

<style scoped>
.forge-view {
  background-color: #2a2a2a;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 16px;
  position: relative;
}

/* 添加关闭区域样式 */
.forge-view::before {
  content: '';
  position: absolute;
  top: -100px;
  left: 0;
  right: 0;
  height: 100px;
  background-color: #2a2a2a;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.forge-view::after {
  content: '点击关闭';
  position: absolute;
  top: -90px;
  left: 50%;
  transform: translateX(-50%);
  color: #e0e0e0;
  font-size: 14px;
  pointer-events: none;
}

.forge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #404040;
  color: #e0e0e0;
  font-size: 24px;
  line-height: 1;
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

.forge-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #e0e0e0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #d0d0d0;
}

.equipment-types {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.equipment-type-item {
  padding: 4px 6px;
  border: 2px solid #404040;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  width: calc(25% - 8px);
  text-align: center;
  font-weight: 500;
  color: #e0e0e0;
  background-color: #333;
  box-sizing: border-box;
}

.equipment-type-item:hover {
  border-color: #ff6b35;
  background-color: #404040;
}

.equipment-type-item.selected {
  background-color: #ff4d00;
  color: white;
  border-color: #ff4d00;
  box-shadow: 0 2px 4px rgba(255, 77, 0, 0.3);
  transform: translateY(-1px);
}

.materials-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.material-item {
  padding: 4px 6px;
  border: 2px solid #404040;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  width: calc(25% - 8px);
  text-align: center;
  font-weight: 500;
  color: #e0e0e0;
  background-color: #333;
  box-sizing: border-box;
}

.material-item:hover {
  border-color: #ff6b35;
  background-color: #404040;
}

.material-item.selected {
  background-color: #ff4d00;
  color: white;
  border-color: #ff4d00;
  box-shadow: 0 2px 4px rgba(255, 77, 0, 0.3);
  transform: translateY(-1px);
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border: 2px solid #404040;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  width: calc(25% - 8px);
  text-align: center;
  font-weight: 500;
  color: #e0e0e0;
  background-color: #333;
  box-sizing: border-box;
}

.selected-item:hover {
  border-color: #ff6b35;
  background-color: #404040;
}

.selected-item button {
  padding: 2px 6px;
  background-color: #ff4d00;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selected-item button:hover {
  background-color: #ff6b35;
}

.forge-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #ff4d00;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.forge-button:hover {
  background-color: #ff6b35;
  box-shadow: 0 2px 8px rgba(255, 77, 0, 0.4);
  transform: translateY(-1px);
}

.forge-button:disabled {
  background-color: #404040;
  color: #666;
  cursor: not-allowed;
}

.forge-result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.forge-result.success {
  background-color: #1b4332;
  border: 1px solid #2d6a4f;
  color: #95d5b2;
}

.forge-result.fail {
  background-color: #7f1d1d;
  border: 1px solid #991b1b;
  color: #fca5a5;
}

.equipment-stats {
  margin-top: 10px;
  padding: 10px;
  background-color: #333;
  border-radius: 4px;
  color: #e0e0e0;
}
</style>
