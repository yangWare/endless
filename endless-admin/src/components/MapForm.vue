<template>
  <div>
    <el-form-item label="背景图片" prop="bgImage">
      <el-input v-model="formData.bgImage" />
    </el-form-item>
    <el-form-item label="宽度" prop="width">
      <el-input-number v-model="formData.width" :min="1" />
    </el-form-item>
    <el-form-item label="高度" prop="height">
      <el-input-number v-model="formData.height" :min="1" />
    </el-form-item>
    <el-form-item label="起始位置" prop="startLocationId">
      <el-select v-model="formData.startLocationId" placeholder="请选择起始位置">
        <el-option
          v-for="location in locations"
          :key="location._id"
          :label="location.name"
          :value="location._id"
        />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Location {
  _id: string
  name: string
}

interface FormData {
  bgImage: string
  width: number
  height: number
  startLocationId: string | null
}

const props = defineProps<{
  formData: FormData
}>()

const locations = ref<Location[]>([])

// 获取位置列表
const fetchLocations = async () => {
  try {
    const response = await axios.get('/endless/api/locations')
    locations.value = response.data.data.locations || []
  } catch (error) {
    ElMessage.error('获取位置列表失败')
  }
}

onMounted(() => {
  fetchLocations()
})
</script> 