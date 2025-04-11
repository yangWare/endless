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
          <template v-if="loading">
            <div v-for="n in 4" :key="n" class="shop-item loading">
              <div class="item-name">加载中...</div>
              <div class="item-price">...</div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="item in shopItems"
              :key="item.id"
              class="shop-item"
              @click="showShopItemInfo(item)"
            >
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">{{ item.price }} 金币</div>
            </div>
          </template>
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
import { computed, ref, defineEmits, nextTick, watch, onUnmounted } from 'vue'
import { state, updatePlayer, loadShopPotions, loadMaterials } from '../store/state'
import i18nConfig from '../config/i18n_config.json'
import Message from './Message.vue'
import { shopAPI } from '../api'

const emit = defineEmits(['close'])

const currentLocation = computed(() => {
  return state.mapLocations[state.currentLocationId]
})

// 商店商品列表
const shopItems = computed(() => {
  const items = currentLocation.value?.npc?.shop?.potionItems || []
  return items.map(item => {
    const potion = state.shopPotions[item.potionId]
    if (!potion) return null
    return {
      id: potion._id,
      name: potion.name,
      description: potion.description,
      effect: potion.effect,
      price: item.price
    }
  }).filter(Boolean)
})
const loading = ref(false)
// 加载商店商品
const loadShopItems = async () => {
  const items = currentLocation.value?.npc?.shop?.potionItems || []
  if (items.length === 0) return

  loading.value = true
  try {
    await loadShopPotions(items.map(item => item.potionId))
  } catch (error) {
    console.error('加载商店商品失败:', error)
  } finally {
    loading.value = false
  }
}
loadShopItems()

const inventoryItems = ref([])
// 加载背包物品
const loadInventoryItems = async () => {
  const materials = state.player?.inventory?.materials || []
  if (materials.length === 0) return
  try {
    console.log('loadInventoryItems', materials)
    await loadMaterials(materials)
    
    // 统计每个材料的数量
    const materialCounts = materials.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1
      return acc
    }, {})

    // 转换材料为物品数组
    const materialItems = Object.entries(materialCounts).map(([materialId, count]) => {
      const material = state.materials[materialId]
      if (!material) return null
      
      return {
        ...material,
        count,
        isMaterial: true
      }
    }).filter(Boolean)

    // 转换装备为物品数组
    const equipmentItems = (state.player?.inventory?.equipments || []).map(equipment => ({
      ...equipment,
      count: 1,
      isMaterial: false
    }))

    // 合并材料和装备
    inventoryItems.value = [...materialItems, ...equipmentItems]
  } catch (error) {
    console.error('加载背包物品失败:', error)
  }
}
console.log('loadInventoryItems', inventoryItems.value)
loadInventoryItems()

// 价格缓存
const priceCache = ref({})

// 组件销毁时清除缓存
onUnmounted(() => {
  priceCache.value = {}
})

// 获取材料价格
const getMaterialPrice = async (materialId) => {
  if (priceCache.value[materialId]) {
    return priceCache.value[materialId]
  }
  
  try {
    const price = await shopAPI.getMaterialPrice(materialId)
    priceCache.value[materialId] = price
    return price
  } catch (error) {
    console.error('获取材料价格失败:', error)
    return 0
  }
}

// 获取装备价格
const getEquipmentPrice = async (equipment) => {
  if (priceCache.value[equipment.id]) {
    return priceCache.value[equipment.id]
  }
  
  try {
    const price = await shopAPI.getEquipmentPrice(equipment)
    priceCache.value[equipment.id] = price
    return price
  } catch (error) {
    console.error('获取装备价格失败:', error)
    return 0
  }
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
  const effectType = i18nConfig.combat_stats[item.effect.type] || item.effect.type
  const effectValue = item.effect.value > 0 ? `+${item.effect.value}` : item.effect.value
  messageContent.value = `${item.name}<br>${item.description}<br>效果: ${effectType} ${effectValue}<br>价格: ${item.price} 金币`
  messageType.value = 'info'
  showMessage.value = true
  showButton.value = true
  buttonText.value = '购买'
  onAction.value = () => handleBuy(item)
}

// 显示背包物品信息
const showInventoryItemInfo = async (item) => {
  let price = 0
  if (item.isMaterial) {
    price = await getMaterialPrice(item._id)
  } else {
    price = await getEquipmentPrice(item)
  }
  const totalPrice = price * item.count
  
  let message = `${item.name}<br>类型: ${item.isMaterial ? item.typeId.name : item.slot}<br>等级: ${item.level}<br>数量: ${item.count}<br>单价: ${price} 金币<br>总价: ${totalPrice} 金币`
  
  if (!item.isMaterial) {
    // 显示装备的战斗属性
    message += '<br><br>战斗属性:<br>'
    Object.entries(item.combatStats).forEach(([stat, value]) => {
      if (value > 0) {
        message += `${stat}: +${value}<br>`
      }
    })
  }
  
  messageContent.value = message
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
  let price = 0
  if (item.isMaterial) {
    price = await getMaterialPrice(item._id)
  } else {
    price = await getEquipmentPrice(item.id)
  }
  const totalPrice = price * item.count
  
  // 更新玩家金币和背包
  const newPlayer = { ...state.player }
  newPlayer.gold += totalPrice
  
  if (item.isMaterial) {
    // 移除所有匹配的材料ID
    newPlayer.materials = newPlayer.materials.filter(id => id !== item._id)
  } else {
    // 移除装备
    newPlayer.inventory.equipments = newPlayer.inventory.equipments.filter(eq => eq.id !== item.id)
  }
  
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
  background-color: #1a1a1a;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 0 12px;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.close-button {
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: #ff6b6b;
  color: white;
  transform: scale(1.1);
}

.shop-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100% - 60px);
}

.shop-section {
  max-height: 30vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 12px;
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

.shop-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 4px;
}

.shop-item {
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.shop-item:hover {
  transform: translateY(-2px);
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.shop-item:active {
  transform: translateY(0);
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.item-price {
  color: #ffd700;
  font-size: 14px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-block;
}

.inventory-section {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 4px;
}

.inventory-item {
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.inventory-item:hover {
  transform: translateY(-2px);
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.inventory-item:active {
  transform: translateY(0);
}

.item-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffd700;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

/* 滚动条样式 */
.shop-section::-webkit-scrollbar,
.inventory-section::-webkit-scrollbar {
  width: 6px;
}

.shop-section::-webkit-scrollbar-track,
.inventory-section::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.shop-section::-webkit-scrollbar-thumb,
.inventory-section::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 3px;
}

.shop-section::-webkit-scrollbar-thumb:hover,
.inventory-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

/* 加载动画 */
.shop-item.loading {
  opacity: 0.7;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 0.4; }
  100% { opacity: 0.7; }
}
</style> 