<template>
  <div>
    <el-form-item label="父级种族" prop="parentRace">
      <el-select v-model="formData.parentRace" placeholder="请选择父级种族" clearable>
        <el-option v-for="race in races" :key="race._id" :label="race.name" :value="race._id" />
      </el-select>
    </el-form-item>
    <el-divider>战斗属性</el-divider>
    <el-form-item v-for="(_, key) in formData.combatStats" :key="key" :label="getCombatStatLabel(key)">
      <el-input-number v-model="formData.combatStats[key]" :min="0" :step="1" />
    </el-form-item>
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

interface FormData {
  parentRace: string | null
  combatStats: Record<string, number>
}

defineProps<{
  formData: FormData
}>()

const races = ref<Race[]>([])

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

// 获取种族列表
const fetchRaces = async () => {
  try {
    const response = await axios.get('/endless/api/races')
    races.value = response.data.data.races || []
  } catch (error) {
    ElMessage.error('获取种族列表失败')
  }
}

onMounted(() => {
  fetchRaces()
})
</script> 