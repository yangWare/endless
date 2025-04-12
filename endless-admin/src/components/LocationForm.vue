<template>
  <div>
    <el-form-item label="所属地图" prop="mapId">
      <el-select v-model="formData.mapId" placeholder="请选择地图">
        <el-option
          v-for="map in maps"
          :key="map._id"
          :label="map.name"
          :value="map._id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="位置X" prop="position.x">
      <el-input-number v-model="formData.position.x" />
    </el-form-item>
    <el-form-item label="位置Y" prop="position.y">
      <el-input-number v-model="formData.position.y" />
    </el-form-item>
    <el-form-item label="相邻位置" prop="adjacentLocations">
      <el-select
        v-model="formData.adjacentLocations"
        multiple
        placeholder="请选择相邻位置"
      >
        <el-option
          v-for="location in locations"
          :key="location._id"
          :label="location.name"
          :value="location._id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="NPC配置" prop="npc">
      <el-collapse>
        <el-collapse-item title="锻造所">
          <el-form-item label="开启锻造所">
            <el-switch v-model="formData.npc.forge.enabled" />
          </el-form-item>
          <el-form-item label="等级" v-if="formData.npc.forge.enabled">
            <el-input-number v-model="formData.npc.forge.level" :min="1" />
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="商店">
          <el-form-item label="开启商店">
            <el-switch v-model="formData.npc.shop.enabled" />
          </el-form-item>
          <template v-if="formData.npc.shop.enabled">
            <el-button @click="addShopPotion">添加药水</el-button>
            <div v-for="(item, index) in formData.npc.shop.potionItems" :key="index">
              <el-form-item :label="'药水' + (index + 1)">
                <el-select v-model="item.potionId" placeholder="请选择药水" style="width: 200px">
                  <el-option v-for="potion in potions" :key="potion._id" :label="potion.name" :value="potion._id" />
                </el-select>
                <el-input-number v-model="item.price" :min="0" placeholder="价格" />
                <el-button type="danger" @click="removeShopPotion(index)">删除</el-button>
              </el-form-item>
            </div>
          </template>
        </el-collapse-item>
      </el-collapse>
    </el-form-item>
    <el-form-item label="敌人配置" prop="enemies">
      <el-button @click="addEnemy">添加敌人</el-button>
      <div v-for="(enemy, index) in formData.enemies" :key="index">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="'敌人' + (index + 1)" :prop="'enemies.' + index + '.creatureId'" :rules="{ required: true, message: '请选择敌人' }">
              <el-select v-model="enemy.creatureId" placeholder="请选择敌人" style="width: 100%">
                <el-option v-for="creature in creatures" :key="creature._id" :label="creature.name" :value="creature._id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :prop="'enemies.' + index + '.probability'" :rules="{ required: true, message: '请输入概率' }">
              <el-input-number v-model="enemy.probability" :min="0" :max="1" :step="0.1" placeholder="概率" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :prop="'enemies.' + index + '.maxCount'" :rules="{ required: true, message: '请输入最大数量' }">
              <el-input-number v-model="enemy.maxCount" :min="1" placeholder="最大数量" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-button type="danger" @click="removeEnemy(index)">删除</el-button>
          </el-col>
        </el-row>
      </div>
    </el-form-item>
    <el-form-item label="敌人刷新时间" prop="enemyUpdateDuration">
      <el-input-number v-model="formData.enemyUpdateDuration" :min="0" :step="1000" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Map {
  _id: string
  name: string
}

interface Location {
  _id: string
  name: string
}

interface Creature {
  _id: string
  name: string
}

interface Potion {
  _id: string
  name: string
}

interface ShopItem {
  potionId: string
  price: number
}

interface LocationEnemy {
  creatureId: string
  probability: number
  maxCount: number
}

interface FormData {
  mapId: string
  position: {
    x: number
    y: number
  }
  adjacentLocations: string[]
  npc: {
    forge: {
      enabled: boolean
      level: number
    }
    shop: {
      enabled: boolean
      potionItems: ShopItem[]
    }
  }
  enemies: LocationEnemy[]
  enemyUpdateDuration: number
}

const props = defineProps<{
  formData: FormData
}>()

const maps = ref<Map[]>([])
const locations = ref<Location[]>([])
const creatures = ref<Creature[]>([])
const potions = ref<Potion[]>([])

// 添加商店药水
const addShopPotion = () => {
  if (!props.formData.npc.shop.potionItems) {
    props.formData.npc.shop.potionItems = []
  }
  props.formData.npc.shop.potionItems.push({
    potionId: '',
    price: 0
  })
}

// 删除商店药水
const removeShopPotion = (index: number) => {
  props.formData.npc.shop.potionItems.splice(index, 1)
}

// 添加敌人
const addEnemy = () => {
  props.formData.enemies.push({
    creatureId: '',
    probability: 0.5,
    maxCount: 1
  })
}

// 移除敌人
const removeEnemy = (index: number) => {
  props.formData.enemies.splice(index, 1)
}

// 获取地图列表
const fetchMaps = async () => {
  try {
    const response = await axios.get('/endless/api/maps')
    maps.value = response.data.data.maps || []
  } catch (error) {
    ElMessage.error('获取地图列表失败')
  }
}

// 获取位置列表
const fetchLocations = async () => {
  try {
    const response = await axios.get('/endless/api/locations')
    locations.value = response.data.data.locations || []
  } catch (error) {
    ElMessage.error('获取位置列表失败')
  }
}

// 获取生物列表
const fetchCreatures = async () => {
  try {
    const response = await axios.get('/endless/api/creatures')
    creatures.value = response.data.data.creatures || []
  } catch (error) {
    ElMessage.error('获取生物列表失败')
  }
}

// 获取药水列表
const fetchPotions = async () => {
  try {
    const response = await axios.get('/endless/api/potions')
    potions.value = response.data.data.potions || []
  } catch (error) {
    ElMessage.error('获取药水列表失败')
  }
}

onMounted(() => {
  fetchMaps()
  fetchLocations()
  fetchCreatures()
  fetchPotions()
})
</script> 