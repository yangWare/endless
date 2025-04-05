<template>
  <div class="data-list">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="地图" name="maps">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('map')">新建地图</el-button>
        </div>
        <el-table :data="maps" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="width" label="宽度" />
          <el-table-column prop="height" label="高度" />
          <el-table-column prop="startLocationId" label="起始位置" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('map', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('map', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="地点" name="locations">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('location')">新建地点</el-button>
        </div>
        <el-table :data="locations" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="mapId" label="所属地图" />
          <el-table-column label="位置" width="150">
            <template #default="scope">
              {{ `(${scope.row.position.x}, ${scope.row.position.y})` }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('location', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('location', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="种族" name="races">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('race')">新建种族</el-button>
        </div>
        <el-table :data="races" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="parentRace" label="父级种族">
            <template #default="scope">
              {{ getParentRaceName(scope.row.parentRace) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('race', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('race', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="生物" name="creatures">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('creature')">新建生物</el-button>
        </div>
        <el-table :data="creatures" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="raceId" label="种族" />
          <el-table-column prop="level" label="等级" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('creature', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('creature', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="材料类型" name="material-types">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('material-types')">新建材料类型</el-button>
        </div>
        <el-table :data="materialTypes" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('material-types', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('material-types', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="材料" name="materials">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('material')">新建材料</el-button>
        </div>
        <el-table :data="materials" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="typeId" label="类型" />
          <el-table-column prop="level" label="等级" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('material', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('material', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="药品" name="potions">
        <div class="table-header">
          <el-button type="primary" @click="handleCreate('potion')">新建药品</el-button>
        </div>
        <el-table :data="potions" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="effectType" label="效果类型" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('potion', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('potion', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { raceApi, creatureApi, materialTypeApi, materialApi, potionApi, locationApi, mapApi } from '../api';
import { useRouter } from 'vue-router';

const activeTab = ref('maps');
const maps = ref<any[]>([]);
const locations = ref<any[]>([]);
const races = ref<any[]>([]);
const creatures = ref<any[]>([]);
const materialTypes = ref<any[]>([]);
const materials = ref<any[]>([]);
const potions = ref<any[]>([]);

const router = useRouter();

const loadData = async () => {
  try {
    switch (activeTab.value) {
      case 'maps':
        const mapRes = await mapApi.list({});
        maps.value = mapRes.data.data.maps || [];
        break;
      case 'locations':
        const locationRes = await locationApi.list({});
        locations.value = locationRes.data.data.locations || [];
        break;
      case 'races':
        const raceRes = await raceApi.list({});
        races.value = raceRes.data.data.races || [];
        break;
      case 'creatures':
        const creatureRes = await creatureApi.list({});
        creatures.value = creatureRes.data.data.creatures || [];
        break;
      case 'material-types':
        const materialTypeRes = await materialTypeApi.list({});
        materialTypes.value = materialTypeRes.data.data.materialTypes || [];
        break;
      case 'materials':
        const materialRes = await materialApi.list({});
        materials.value = materialRes.data.data.materials || [];
        break;
      case 'potions':
        const potionRes = await potionApi.list({});
        potions.value = potionRes.data.data.potions || [];
        break;
    }
  } catch (error) {
    ElMessage.error('加载数据失败');
  }
};

const handleTabClick = () => {
  loadData();
};

const handleEdit = (type: string, row: any) => {
  const route = router.resolve({
    name: 'Edit',
    params: { id: row._id },
    query: { type }
  });
  window.open(route.href, '_blank');
};

const handleDelete = async (type: string, row: any) => {
  try {
    switch (type) {
      case 'map':
        await mapApi.delete(row._id);
        break;
      case 'location':
        await locationApi.delete(row._id);
        break;
      case 'race':
        await raceApi.delete(row._id);
        break;
      case 'creature':
        await creatureApi.delete(row._id);
        break;
      case 'material-types':
        await materialTypeApi.delete(row._id);
        break;
      case 'material':
        await materialApi.delete(row._id);
        break;
      case 'potion':
        await potionApi.delete(row._id);
        break;
    }
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

const handleCreate = (type: string) => {
  const route = router.resolve({
    name: 'Create',
    query: { type }
  });
  window.open(route.href, '_blank');
};

const getParentRaceName = (parentRaceId: string | null) => {
  if (!parentRaceId) return '-';
  const parentRace = races.value.find(race => race._id === parentRaceId);
  return parentRace ? parentRace.name : '-';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.data-list {
  padding: 16px;
}

.table-header {
  margin-bottom: 16px;
}

:deep(.el-tabs__content) {
  padding: 16px 0;
}

:deep(.el-table) {
  margin-top: 8px;
}
</style> 