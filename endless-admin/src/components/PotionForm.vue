<template>
  <div>
    <el-form-item label="效果类型" prop="effect.type">
      <el-select v-model="formData.effect.type" placeholder="请选择效果类型">
        <el-option label="生命值" value="hp" />
        <el-option label="攻击力" value="attack" />
        <el-option label="防御力" value="defense" />
        <el-option label="暴击率" value="crit_rate" />
        <el-option label="暴击抗性" value="crit_resist" />
        <el-option label="暴击伤害" value="crit_damage" />
        <el-option label="暴击伤害抗性" value="crit_damage_resist" />
        <el-option label="命中率" value="hit_rate" />
        <el-option label="闪避率" value="dodge_rate" />
      </el-select>
    </el-form-item>
    <el-form-item label="效果值" prop="effect.value">
      <el-input-number v-model="formData.effect.value" :step="0.1" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface FormData {
  effect: {
    type: string
    value: number
  }
}

const props = defineProps<{
  formData: FormData
}>()
</script> 