<template>
  <div class="create-container">
    <el-card class="create-card">
      <template #header>
        <div class="card-header">
          <span>新建</span>
        </div>
      </template>

      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" @change="handleTypeChange">
            <el-option label="种族" value="race" />
            <el-option label="生物" value="creature" />
            <el-option label="材料类型" value="material-types" />
            <el-option label="材料" value="material" />
            <el-option label="药水" value="potion" />
            <el-option label="地点" value="location" />
            <el-option label="地图" value="map" />
          </el-select>
        </el-form-item>

        <BaseForm :formData="formData" />

        <RaceForm v-if="formData.type === 'race'" :formData="formData" />
        <CreatureForm v-if="formData.type === 'creature'" :formData="formData" />
        <MaterialTypeForm v-if="formData.type === 'material-types'" :formData="formData" />
        <MaterialForm v-if="formData.type === 'material'" :formData="formData" />
        <PotionForm v-if="formData.type === 'potion'" :formData="formData" />
        <MapForm v-if="formData.type === 'map'" :formData="formData" />
        <LocationForm v-if="formData.type === 'location'" :formData="formData" />

        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
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
  probability_bonus: {
    epic_forge: null,
    legendary_forge: null,
    mythic_forge: null,
  },
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
}

// 类型改变时重置表单
const handleTypeChange = () => {
  // 保留基础字段
  const baseFields = {
    type: formData.type,
    name: formData.name,
    description: formData.description,
  }

  // 重置表单
  formRef.value?.resetFields()

  // 恢复基础字段
  Object.assign(formData, baseFields)

  // 根据类型重置特定字段
  switch (formData.type) {
    case 'race':
      formData.parentRace = null
      formData.combatStats = {
        max_hp: 10.0,
        attack: 2.0,
        defense: 1.0,
        crit_rate: 1.0,
        crit_resist: 1.0,
        crit_damage: 1.0,
        crit_damage_resist: 1.0,
        hit_rate: 1.0,
        dodge_rate: 1.0,
      }
      break
    case 'creature':
      formData.raceId = ''
      formData.level = 1
      formData.combat_multipliers = {
        max_hp: 1.0,
        attack: 1.0,
        defense: 1.0,
        crit_rate: 1.0,
        crit_resist: 1.0,
        crit_damage: 1.0,
        crit_damage_resist: 1.0,
        hit_rate: 1.0,
        dodge_rate: 1.0,
      }
      formData.drop_materials = []
      break
    case 'material-types':
      formData.combat_bonus = {
        max_hp: null,
        attack: null,
        defense: null,
        crit_rate: null,
        crit_resist: null,
        crit_damage: null,
        crit_damage_resist: null,
        hit_rate: null,
        dodge_rate: null,
      }
      formData.probability_bonus = {
        epic_forge: null,
        legendary_forge: null,
        mythic_forge: null,
      }
      break
    case 'material':
      formData.level = 1
      formData.combat_multipliers = {
        max_hp: 1.0,
        attack: 1.0,
        defense: 1.0,
        crit_rate: 1.0,
        crit_resist: 1.0,
        crit_damage: 1.0,
        crit_damage_resist: 1.0,
        hit_rate: 1.0,
        dodge_rate: 1.0,
      }
      formData.probability_bonus = {
        epic_forge: null,
        legendary_forge: null,
        mythic_forge: null,
      }
      break
    case 'potion':
      formData.effect = {
        type: '',
        value: 0,
      }
      break
    case 'location':
      formData.mapId = ''
      formData.position = { x: 0, y: 0 }
      formData.adjacentLocations = []
      formData.npc = {
        forge: {
          enabled: false,
          level: 1,
        },
        shop: {
          enabled: false,
          potionItems: [],
        },
      }
      formData.enemies = []
      formData.enemyUpdateDuration = 3600000
      break
    case 'map':
      formData.bgImage = ''
      formData.width = 1000
      formData.height = 1000
      formData.startLocationId = null
      break
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let endpoint = ''
        let data = {}

        // 根据类型准备数据和端点
        switch (formData.type) {
          case 'race':
            endpoint = '/endless/api/races'
            data = {
              name: formData.name,
              description: formData.description,
              parentRace: formData.parentRace,
              combatStats: formData.combatStats,
            }
            break
          case 'creature':
            endpoint = '/endless/api/creatures'
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
            endpoint = '/endless/api/material-types'
            data = {
              name: formData.name,
              description: formData.description,
              combat_bonus: formData.combat_bonus,
              probability_bonus: formData.probability_bonus,
            }
            break
          case 'material':
            endpoint = '/endless/api/materials'
            data = {
              name: formData.name,
              description: formData.description,
              typeId: formData.typeId,
              level: formData.level,
              combat_multipliers: formData.combat_multipliers,
              probability_bonus: formData.probability_bonus,
            }
            break
          case 'potion':
            endpoint = '/endless/api/potions'
            data = {
              name: formData.name,
              description: formData.description,
              effect: formData.effect,
            }
            break
          case 'location':
            endpoint = '/endless/api/locations'
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
            endpoint = '/endless/api/maps'
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

        const response = await axios.post(endpoint, data)
        if (response.data.success) {
          ElMessage.success('创建成功')
          // 跳转到编辑页面
          router.push({
            name: 'Edit',
            params: { id: response.data.data._id },
            query: { type: formData.type },
          })
        } else {
          ElMessage.error(response.data.error || '创建失败')
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '创建失败')
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
  // 从 URL 参数中获取类型
  const type = route.query.type as string
  if (type) {
    formData.type = type
  }
})
</script>

<style scoped>
.create-container {
  padding: 20px;
}

.create-card {
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
