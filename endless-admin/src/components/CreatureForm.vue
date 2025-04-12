<template>
  <div>
    <el-form-item label="种族" prop="raceId">
      <el-select v-model="formData.raceId" placeholder="请选择种族">
        <el-option v-for="race in races" :key="race._id" :label="race.name" :value="race._id" />
      </el-select>
    </el-form-item>
    <el-form-item label="等级" prop="level">
      <el-input-number v-model="formData.level" :min="1" />
    </el-form-item>
    <el-divider>战斗属性倍率</el-divider>
    <el-form-item v-for="(_, key) in formData.combat_multipliers" :key="key" :label="getCombatStatLabel(key)">
      <el-input-number v-model="formData.combat_multipliers[key]" :min="0" :step="0.1" />
    </el-form-item>
    <el-divider>掉落材料</el-divider>
    <el-form-item v-for="(item, index) in formData.drop_materials" :key="index">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :prop="'drop_materials.' + index + '.materialId'" :rules="{ required: true, message: '请选择材料' }">
            <el-select v-model="item.materialId" placeholder="请选择材料" style="width: 100%">
              <el-option v-for="material in materials" :key="material._id" :label="material.name" :value="material._id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :prop="'drop_materials.' + index + '.probability'" :rules="{ required: true, message: '请输入掉落概率' }">
            <el-input-number v-model="item.probability" :min="0" :max="1" :step="0.1" placeholder="掉落概率" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form-item>
    <el-button type="primary" @click="addDropMaterial">添加掉落材料</el-button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Race {
  _id: string
  name: string
}

interface Material {
  _id: string
  name: string
}

interface DropMaterial {
  materialId: string
  probability: number
}

interface FormData {
  raceId: string
  level: number
  combat_multipliers: Record<string, number>
  drop_materials: DropMaterial[]
}

const props = defineProps<{
  formData: FormData
}>()

const races = ref<Race[]>([])
const materials = ref<Material[]>([])

// 获取战斗属性标签
const getCombatStatLabel = (key: string) => {
  const labels: Record<string, string> = {
    max_hp: '最大生命值',
    attack: '攻击力',
    defense: '防御力',
    crit_rate: '暴击率',
    crit_resist: '暴击抗性',
    crit_damage: '暴击伤害',
    crit_damage_resist: '暴击伤害抗性',
    hit_rate: '命中率',
    dodge_rate: '闪避率'
  }
  return labels[key] || key
}

// 添加掉落材料
const addDropMaterial = () => {
  props.formData.drop_materials.push({
    materialId: '',
    probability: 0
  })
}

// 获取种族列表
const fetchRaces = async () => {
  try {
    const response = await axios.get('/endless/api/races')
    races.value = response.data.data.races || []
  } catch (error) {
    ElMessage.error('获取种族列表失败')
  }
}

// 获取材料列表
const fetchMaterials = async () => {
  try {
    const response = await axios.get('/endless/api/materials')
    materials.value = response.data.data.materials || []
  } catch (error) {
    ElMessage.error('获取材料列表失败')
  }
}

onMounted(() => {
  fetchRaces()
  fetchMaterials()
})
</script> 