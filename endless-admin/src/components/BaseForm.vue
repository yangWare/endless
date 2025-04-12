<template>
  <div>
    <el-form-item label="名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" v-model="formData.description" placeholder="请输入描述" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface FormData {
  name: string
  description: string
}

const props = defineProps<{
  formData: FormData
}>()
</script> 