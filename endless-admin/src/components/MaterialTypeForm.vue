<template>
  <div>
    <el-divider>战斗属性加成</el-divider>
    <el-form-item v-for="(_, key) in formData.combat_bonus" :key="key" :label="getCombatStatLabel(key)">
      <el-input-number 
        v-model="formData.combat_bonus[key]" 
        :min="0" 
        :step="1"
        :controls-position="'right'"
        placeholder="留空表示无加成"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface FormData {
  combat_bonus: {
    max_hp: number | null
    attack: number | null
    defense: number | null
    crit_rate: number | null
    crit_resist: number | null
    crit_damage: number | null
    crit_damage_resist: number | null
    hit_rate: number | null
    dodge_rate: number | null
  }
}

defineProps<{
  formData: FormData
}>()

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
</script> 