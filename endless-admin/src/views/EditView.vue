<template>
  <div class="edit-container">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <span>编辑</span>
        </div>
      </template>
      
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <!-- 基础字段 -->
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="formData.description" placeholder="请输入描述" />
        </el-form-item>

        <!-- 种族特有字段 -->
        <template v-if="type === 'race'">
          <el-form-item label="父级种族" prop="parentRace">
            <el-select v-model="formData.parentRace" placeholder="请选择父级种族" clearable>
              <el-option v-for="race in races" :key="race._id" :label="race.name" :value="race._id" />
            </el-select>
          </el-form-item>
          <el-divider>战斗属性</el-divider>
          <el-form-item v-for="(_, key) in formData.combatStats" :key="key" :label="getCombatStatLabel(key)">
            <el-input-number v-model="formData.combatStats[key]" :min="0" :step="0.1" />
          </el-form-item>
        </template>

        <!-- 生物特有字段 -->
        <template v-if="type === 'creature'">
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
                <el-form-item :prop="'drop_materials.' + index + '.name'" :rules="{ required: true, message: '请选择材料' }">
                  <el-select v-model="item.name" placeholder="请选择材料" style="width: 100%">
                    <el-option v-for="material in materials" :key="material._id" :label="material.name" :value="material.name" />
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
        </template>

        <!-- 材料特有字段 -->
        <template v-if="type === 'material'">
          <el-form-item label="等级" prop="level">
            <el-input-number v-model="formData.level" :min="1" />
          </el-form-item>
          <el-divider>战斗属性倍率</el-divider>
          <el-form-item v-for="(_, key) in formData.combat_multipliers" :key="key" :label="getCombatStatLabel(key)">
            <el-input-number v-model="formData.combat_multipliers[key]" :min="0" :step="0.1" />
          </el-form-item>
        </template>

        <!-- 药水特有字段 -->
        <template v-if="type === 'potion'">
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
        </template>

        <template v-if="type === 'map'">
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
        </template>

        <template v-if="type === 'location'">
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
                <el-form-item label="等级">
                  <el-input-number v-model="formData.npc.forge.level" :min="1" />
                </el-form-item>
              </el-collapse-item>
              <el-collapse-item title="商店">
                <el-button @click="addShopItem">添加商品</el-button>
                <div v-for="(item, index) in formData.npc.shop.items" :key="index">
                  <el-form-item :label="'商品' + (index + 1)">
                    <el-select v-model="item.id" placeholder="请选择商品" style="width: 200px">
                      <el-option v-for="material in materials" :key="material._id" :label="material.name" :value="material._id" />
                      <el-option v-for="potion in potions" :key="potion._id" :label="potion.name" :value="potion._id" />
                    </el-select>
                    <el-input-number v-model="item.price" :min="0" placeholder="价格" />
                    <el-button type="danger" @click="removeShopItem(index)">删除</el-button>
                  </el-form-item>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>
          <el-form-item label="敌人配置" prop="enemy">
            <el-button @click="addEnemy">添加敌人</el-button>
            <div v-for="(enemy, name) in formData.enemy" :key="name">
              <el-form-item :label="name">
                <el-input v-model="enemy.probability" type="number" placeholder="概率" style="width: 200px" />
                <el-input-number v-model="enemy.maxCount" :min="1" placeholder="最大数量" />
                <el-button type="danger" @click="removeEnemy(name)">删除</el-button>
              </el-form-item>
            </div>
          </el-form-item>
          <el-form-item label="敌人刷新时间" prop="enemyUpdateDuration">
            <el-input-number v-model="formData.enemyUpdateDuration" :min="0" :step="1000" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="goBack">返回</el-button>
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

interface Race {
  _id: string
  name: string
}

interface Material {
  _id: string
  name: string
}

interface DropMaterial {
  name: string
  probability: number
}

interface ShopItem {
  id: string
  price: number
}

interface Enemy {
  probability: number
  maxCount: number
}

interface Map {
  _id: string
  name: string
  bgImage: string
  width: number
  height: number
  startLocationId: string
}

interface Location {
  _id: string
  name: string
  mapId: string
  position: {
    x: number
    y: number
  }
  adjacentLocations: string[]
  npc: {
    forge: {
      level: number
    }
    shop: {
      items: ShopItem[]
    }
  }
  enemy: Record<string, Enemy>
  enemyUpdateDuration: number
}

interface Potion {
  _id: string
  name: string
}

interface FormData {
  id?: number;
  name: string;
  description: string;
  // 种族特有
  parentRace: string | null;
  combatStats: Record<string, number>;
  // 生物特有
  raceId: string;
  level: number;
  combat_multipliers: Record<string, number>;
  drop_materials: DropMaterial[];
  // 材料特有
  // 药水特有
  effect: {
    type: string;
    value: number;
  };
  // Map specific fields
  bgImage: string;
  width: number;
  height: number;
  startLocationId: string;
  // Location specific fields
  mapId: string;
  position: {
    x: number;
    y: number;
  };
  adjacentLocations: string[];
  npc: {
    forge: {
      level: number;
    };
    shop: {
      items: ShopItem[];
    };
  };
  enemy: Record<string, Enemy>;
  enemyUpdateDuration: number;
}

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const races = ref<Race[]>([])
const materials = ref<Material[]>([])
const maps = ref<Map[]>([])
const locations = ref<Location[]>([])
const potions = ref<Potion[]>([])

const type = ref(route.query.type as string)
const id = ref(route.params.id as string)

// 表单数据
const formData = reactive<FormData>({
  id: undefined,
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
    dodge_rate: 1.0
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
    dodge_rate: 1.0
  },
  drop_materials: [] as DropMaterial[],
  // 材料特有
  // 药水特有
  effect: {
    type: '',
    value: 0
  },
  // Map specific fields
  bgImage: '',
  width: 1000,
  height: 1000,
  startLocationId: '',
  // Location specific fields
  mapId: '',
  position: {
    x: 0,
    y: 0
  },
  adjacentLocations: [] as string[],
  npc: {
    forge: {
      level: 1
    },
    shop: {
      items: [] as ShopItem[]
    }
  },
  enemy: {} as Record<string, Enemy>,
  enemyUpdateDuration: 3600000
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  raceId: [{ required: true, message: '请选择种族', trigger: 'change' }],
  level: [{ required: true, message: '请输入等级', trigger: 'blur' }],
  'effect.type': [{ required: true, message: '请选择效果类型', trigger: 'change' }],
  'effect.value': [{ required: true, message: '请输入效果值', trigger: 'blur' }],
  // Map specific rules
  bgImage: [{ required: true, message: '请输入背景图片路径', trigger: 'blur' }],
  width: [{ required: true, message: '请输入地图宽度', trigger: 'blur' }],
  height: [{ required: true, message: '请输入地图高度', trigger: 'blur' }],
  startLocationId: [{ required: true, message: '请输入起始位置ID', trigger: 'blur' }],
  // Location specific rules
  mapId: [{ required: true, message: '请选择所属地图', trigger: 'change' }],
  'position.x': [{ required: true, message: '请输入X坐标', trigger: 'blur' }],
  'position.y': [{ required: true, message: '请输入Y坐标', trigger: 'blur' }],
}

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
  formData.drop_materials.push({
    name: '',
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

// 获取药水列表
const fetchPotions = async () => {
  try {
    const response = await axios.get('/endless/api/potions')
    potions.value = response.data.data.potions || []
  } catch (error) {
    ElMessage.error('获取药水列表失败')
  }
}

// 获取详情
const fetchDetail = async () => {
  try {
    let endpoint = '';
    switch (type.value) {
      case 'race':
        endpoint = `/endless/api/races/${id.value}`;
        break;
      case 'creature':
        endpoint = `/endless/api/creatures/${id.value}`;
        break;
      case 'material':
        endpoint = `/endless/api/materials/${id.value}`;
        break;
      case 'potion':
        endpoint = `/endless/api/potions/${id.value}`;
        break;
      case 'map':
        endpoint = `/endless/api/maps/${id.value}`;
        break;
      case 'location':
        endpoint = `/endless/api/locations/${id.value}`;
        break;
    }

    const response = await axios.get(endpoint);
    if (response.data.success) {
      Object.assign(formData, response.data.data);
    }
  } catch (error) {
    ElMessage.error('获取详情失败');
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let endpoint = '';
        let data = {};

        // 根据类型准备数据和端点
        switch (type.value) {
          case 'race':
            endpoint = `/endless/api/races/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              parentRace: formData.parentRace,
              combatStats: formData.combatStats
            };
            break;
          case 'creature':
            endpoint = `/endless/api/creatures/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              raceId: formData.raceId,
              level: formData.level,
              combat_multipliers: formData.combat_multipliers,
              drop_materials: formData.drop_materials
            };
            break;
          case 'material':
            endpoint = `/endless/api/materials/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              level: formData.level,
              combat_multipliers: formData.combat_multipliers
            };
            break;
          case 'potion':
            endpoint = `/endless/api/potions/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              effect: formData.effect
            };
            break;
          case 'map':
            endpoint = `/endless/api/maps/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              bgImage: formData.bgImage,
              width: formData.width,
              height: formData.height,
              startLocationId: formData.startLocationId
            };
            break;
          case 'location':
            endpoint = `/endless/api/locations/${id.value}`;
            data = {
              name: formData.name,
              description: formData.description,
              mapId: formData.mapId,
              position: formData.position,
              adjacentLocations: formData.adjacentLocations,
              npc: formData.npc,
              enemy: formData.enemy,
              enemyUpdateDuration: formData.enemyUpdateDuration
            };
            break;
        }

        const response = await axios.put(endpoint, data);
        if (response.data.success) {
          ElMessage.success('保存成功');
          goBack();
        } else {
          ElMessage.error(response.data.error || '保存失败');
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '保存失败');
      }
    }
  })
}

// 返回列表页
const goBack = () => {
  router.push('/');
}

const addShopItem = () => {
  if (!formData.npc.shop.items) {
    formData.npc.shop.items = [];
  }
  formData.npc.shop.items.push({
    id: '',
    price: 0
  });
}

const removeShopItem = (index: number) => {
  formData.npc.shop.items.splice(index, 1);
}

const addEnemy = () => {
  const name = window.prompt('请输入敌人名称');
  if (name) {
    formData.enemy[name] = {
      probability: 0.5,
      maxCount: 1
    };
  }
}

const removeEnemy = (name: string) => {
  delete formData.enemy[name];
}

onMounted(() => {
  fetchRaces()
  fetchMaterials()
  fetchMaps()
  fetchLocations()
  fetchPotions()
  fetchDetail()
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