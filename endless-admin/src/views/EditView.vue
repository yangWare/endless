<template>
  <div class="edit-container">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <span>编辑</span>
        </div>
      </template>

      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <BaseForm :formData="formData" />

        <RaceForm v-if="formData.type === 'race'" :formData="formData" />
        <CreatureForm v-if="formData.type === 'creature'" :formData="formData" />
        <MaterialTypeForm v-if="formData.type === 'material-types'" :formData="formData" />
        <MaterialForm v-if="formData.type === 'material'" :formData="formData" />
        <PotionForm v-if="formData.type === 'potion'" :formData="formData" />
        <MapForm v-if="formData.type === 'map'" :formData="formData" />
        <LocationForm v-if="formData.type === 'location'" :formData="formData" />

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import BaseForm from '../components/BaseForm.vue'
import RaceForm from '../components/RaceForm.vue'
import CreatureForm from '../components/CreatureForm.vue'
import MaterialTypeForm from '../components/MaterialTypeForm.vue'
import MaterialForm from '../components/MaterialForm.vue'
import PotionForm from '../components/PotionForm.vue'
import MapForm from '../components/MapForm.vue'
import LocationForm from '../components/LocationForm.vue'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  type: '',
  name: '',
  description: '',
  // 种族特有
  parentRace: null as string | null,
  combatStats: {
    max_hp: 10.0,
    attack: 2.0,
    defense: 1.0,
    crit_rate: 1.0,
    crit_resist: 1.0,
    crit_damage: 1.0,
    crit_damage_resist: 1.0,
    hit_rate: 1.0,
    dodge_rate: 1.0,
  },
  // 生物特有
  raceId: '',
  level: 1,
  combat_multipliers: {
    max_hp: 1.0,
    attack: 1.0,
    defense: 1.0,
    crit_rate: 1.0,
    crit_resist: 1.0,
    crit_damage: 1.0,
    crit_damage_resist: 1.0,
    hit_rate: 1.0,
    dodge_rate: 1.0,
  },
  drop_materials: [] as any[],
  // 材料特有
  typeId: '',
  // 药水特有
  effect: {
    type: '',
    value: 0,
  },
  // Map specific fields
  bgImage: '',
  width: 1000,
  height: 1000,
  startLocationId: null,
  // Location specific fields
  mapId: '',
  position: {
    x: 0,
    y: 0,
  },
  adjacentLocations: [] as string[],
  npc: {
    forge: {
      enabled: false,
      level: 1,
    },
    shop: {
      enabled: false,
      potionItems: [] as any[],
    },
  },
  enemies: [] as any[],
  enemyUpdateDuration: 3600000,
  combat_bonus: {
    max_hp: null,
    attack: null,
    defense: null,
    crit_rate: null,
    crit_resist: null,
    crit_damage: null,
    crit_damage_resist: null,
    hit_rate: null,
    dodge_rate: null,
  },
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
}

const setDefaultValue = () => {
  if (formData.type === 'location') {
    if (!formData.npc?.forge) {
      formData.npc.forge = {
        enabled: false,
        level: 1,
      }
    } else {
      formData.npc.forge.enabled = true
    }
    if (!formData.npc?.shop) {
      formData.npc.shop = {
        enabled: false,
        potionItems: [],
      }
    } else {
      formData.npc.shop.enabled = true
    }
  }
}

// 获取数据
const fetchData = async () => {
  const id = route.params.id as string
  const type = route.query.type as string
  if (!id || !type) {
    ElMessage.error('参数错误')
    router.push('/')
    return
  }

  try {
    let endpoint = ''
    switch (type) {
      case 'race':
        endpoint = `/endless/api/races/${id}`
        break
      case 'creature':
        endpoint = `/endless/api/creatures/${id}/admin`
        break
      case 'material-types':
        endpoint = `/endless/api/material-types/${id}`
        break
      case 'material':
        endpoint = `/endless/api/materials/${id}/admin`
        break
      case 'potion':
        endpoint = `/endless/api/potions/${id}`
        break
      case 'location':
        endpoint = `/endless/api/locations/${id}/admin`
        break
      case 'map':
        endpoint = `/endless/api/maps/${id}`
        break
    }

    const response = await axios.get(endpoint)
    if (response.data.success) {
      Object.assign(formData, response.data.data)
      formData.type = type
      setDefaultValue()
    } else {
      ElMessage.error(response.data.error || '获取数据失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取数据失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const id = route.params.id as string
        let endpoint = ''
        let data = {}

        // 根据类型准备数据和端点
        switch (formData.type) {
          case 'race':
            endpoint = `/endless/api/races/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              parentRace: formData.parentRace,
              combatStats: formData.combatStats,
            }
            break
          case 'creature':
            endpoint = `/endless/api/creatures/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              raceId: formData.raceId,
              level: formData.level,
              combat_multipliers: formData.combat_multipliers,
              drop_materials: formData.drop_materials,
            }
            break
          case 'material-types':
            endpoint = `/endless/api/material-types/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              combat_bonus: formData.combat_bonus,
            }
            break
          case 'material':
            endpoint = `/endless/api/materials/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              typeId: formData.typeId,
              level: formData.level,
              combat_multipliers: formData.combat_multipliers,
            }
            break
          case 'potion':
            endpoint = `/endless/api/potions/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              effect: formData.effect,
            }
            break
          case 'location':
            endpoint = `/endless/api/locations/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              mapId: formData.mapId,
              position: formData.position,
              adjacentLocations: formData.adjacentLocations,
              npc: {
                forge: formData.npc.forge.enabled ? formData.npc.forge : null,
                shop: formData.npc.shop.enabled ? formData.npc.shop : null,
              },
              enemies: formData.enemies,
              enemyUpdateDuration: formData.enemyUpdateDuration,
            }
            break
          case 'map':
            endpoint = `/endless/api/maps/${id}`
            data = {
              name: formData.name,
              description: formData.description,
              bgImage: formData.bgImage,
              width: formData.width,
              height: formData.height,
              startLocationId: formData.startLocationId,
            }
            break
        }

        const response = await axios.put(endpoint, data)
        if (response.data.success) {
          ElMessage.success('保存成功')
          fetchData() // 重新获取数据
        } else {
          ElMessage.error(response.data.error || '保存失败')
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '保存失败')
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.edit-container {
  padding: 20px;
}

.edit-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 