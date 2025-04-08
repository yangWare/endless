<template>
  <div class="shop-view-container">
    <div class="shop-header">
      <div class="title">商店</div>
      <div class="close-button" @click="handleClose">×</div>
    </div>

    <div class="shop-content">
      <!-- 商店商品列表 -->
      <div class="shop-section">
        <div class="shop-grid">
          <div
            v-for="item in shopItems"
            :key="item.id"
            class="shop-item"
            @click="showShopItemInfo(item)"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ item.price }} 金币</div>
          </div>
        </div>
      </div>

      <!-- 玩家背包 -->
      <div class="inventory-section">
        <div class="inventory-grid">
          <div
            v-for="item in inventoryItems"
            :key="item.id"
            class="inventory-item"
            @click="showInventoryItemInfo(item)"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ calculateMaterialPrice(item) }} 金币</div>
            <div class="item-count" v-if="item.count > 1">x{{ item.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息弹窗 -->
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
import { computed, ref, defineEmits, nextTick } from 'vue'
import { state, updatePlayer } from '../store/state'
import potionConfig from '../config/potion_config.json'
import materialConfig from '../config/material_config.json'
import Message from './Message.vue'

const emit = defineEmits(['close'])

// 获取当前地图和位置信息
const currentMap = computed(() => {
  return state.currentMap
})

const currentLocation = computed(() => {
  return currentMap.value?.locations[state.currentLocationId]
})

// 商店商品列表
const shopItems = computed(() => {
  const shopItems = currentLocation.value?.npc?.shop?.items || []
  return shopItems.map(item => {
    const potion = potionConfig.potions[item.id]
    return {
      ...item,
      name: potion.name,
      description: potion.description,
      effect: potion.effect
    }
  })
})

// 玩家背包物品
const inventoryItems = computed(() => {
  const materials = state.player.materials || []
  // 统计每个材料的数量
  const materialCounts = materials.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  // 转换为物品数组
  return Object.entries(materialCounts).map(([materialId, count]) => {
    // 遍历所有材料类型查找对应的材料
    for (const type of Object.values(materialConfig.material_types)) {
      const material = type.materials[materialId]
      if (material) {
        return {
          id: materialId,
          name: material.name,
          level: material.level,
          type: type.name,
          count
        }
      }
    }
    return null
  }).filter(Boolean)
})

// 计算材料价格
const calculateMaterialPrice = (material) => {
  // 基础价格 * 等级
  const basePrice = 100
  return basePrice * material.level
}

// 消息弹窗相关
const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')
const showButton = ref(false)
const buttonText = ref('确定')
const onAction = ref(() => {})

// 显示商店商品信息
const showShopItemInfo = (item) => {
  messageContent.value = `${item.name}<br>${item.description}<br>价格: ${item.price} 金币`
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '购买'
  onAction.value = () => handleBuy(item)
}

// 显示背包物品信息
const showInventoryItemInfo = (item) => {
  const price = calculateMaterialPrice(item)
  const totalPrice = price * item.count
  messageContent.value = `${item.name}<br>类型: ${item.type}<br>等级: ${item.level}<br>数量: ${item.count}<br>单价: ${price} 金币<br>总价: ${totalPrice} 金币`
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '批量出售'
  onAction.value = () => handleSell(item)
}

// 处理购买
const handleBuy = async (item) => {
  if (state.player.gold < item.price) {
    nextTick(() => {
      messageContent.value = '金币不足！'
      messageType.value = 'error'
      showButton.value = false
      showMessage.value = true
    })
    return
  }

  // 更新玩家金币和背包
  const newPlayer = { ...state.player }
  newPlayer.gold -= item.price
  newPlayer.potions.push(item.id)
  await updatePlayer(newPlayer)

  nextTick(() => {
    messageContent.value = '购买成功！'
    messageType.value = 'success'
    showButton.value = false
    showMessage.value = true
  })
}

// 处理出售
const handleSell = async (item) => {
  const price = calculateMaterialPrice(item)
  const totalPrice = price * item.count
  
  // 更新玩家金币和背包
  const newPlayer = { ...state.player }
  newPlayer.gold += totalPrice
  
  // 移除所有匹配的材料ID
  newPlayer.materials = newPlayer.materials.filter(id => id !== item.id)
  await updatePlayer(newPlayer)

  nextTick(() => {
    messageContent.value = `批量出售成功！获得 ${totalPrice} 金币`
    messageType.value = 'success'
    showButton.value = false
    showMessage.value = true
  })
}

const handleAction = () => {
  onAction.value()
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.shop-view-container {
  height: 100%;
  background-color: #3a3a3a;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #3a3a3a;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.close-button {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: #ff6b6b;
  color: white;
}

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #3a3a3a;
}

.shop-section {
  position: relative;
  padding-bottom: 24px;
}

.shop-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, 
    transparent 0%, 
    rgba(255, 215, 0, 0.5) 20%, 
    rgba(255, 215, 0, 0.8) 50%, 
    rgba(255, 215, 0, 0.5) 80%, 
    transparent 100%
  );
}

.shop-grid,
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.shop-item,
.inventory-item {
  background-color: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.shop-item:hover,
.inventory-item:hover {
  transform: translateY(-2px);
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.shop-item:active,
.inventory-item:active {
  transform: translateY(0);
}

.item-name {
  font-size: 16px;
  margin-bottom: 8px;
  color: #fff;
}

.item-price {
  color: #ffd700;
  font-size: 14px;
  font-weight: 500;
  margin-top: 4px;
}

.item-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffd700;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 滚动条样式 */
.shop-content::-webkit-scrollbar {
  width: 8px;
}

.shop-content::-webkit-scrollbar-track {
  background: #3a3a3a;
  border-radius: 4px;
}

.shop-content::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.shop-content::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
</style> 