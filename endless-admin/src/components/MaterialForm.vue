<template>
  <div>
    <el-form-item label="材料类型" prop="typeId">
      <el-select v-model="formData.typeId" placeholder="请选择材料类型">
        <el-option
          v-for="type in materialTypes"
          :key="type._id"
          :label="type.name"
          :value="type._id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="等级" prop="level">
      <el-input-number v-model="formData.level" :min="1" />
    </el-form-item>
    <el-divider>战斗属性倍率</el-divider>
    <el-form-item v-for="(_, key) in formData.combat_multipliers" :key="key" :label="getCombatStatLabel(key)">
      <el-input-number v-model="formData.combat_multipliers[key]" :min="0" :step="0.1" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface MaterialType {
  _id: string
  name: string
}

interface FormData {
  typeId: string
  level: number
  combat_multipliers: Record<string, number>
}

const props = defineProps<{
  formData: FormData
}>()

const materialTypes = ref<MaterialType[]>([])

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

// 获取材料类型列表
const fetchMaterialTypes = async () => {
  try {
    const response = await axios.get('/endless/api/material-types')
    materialTypes.value = response.data.data.materialTypes || []
  } catch (error) {
    ElMessage.error('获取材料类型列表失败')
  }
}

onMounted(() => {
  fetchMaterialTypes()
})
</script> 