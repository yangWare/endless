<template>
  <div class="data-list">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="种族" name="races">
        <el-table :data="races" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="parentRace" label="父级种族" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('race', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('race', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="生物" name="creatures">
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

      <el-tab-pane label="材料类型" name="materialTypes">
        <el-table :data="materialTypes" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit('materialType', scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete('materialType', scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="材料" name="materials">
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" />
        </el-form-item>
        <template v-if="activeTab === 'creatures'">
          <el-form-item label="种族">
            <el-input v-model="formData.raceId" />
          </el-form-item>
          <el-form-item label="等级">
            <el-input-number v-model="formData.level" :min="1" />
          </el-form-item>
        </template>
        <template v-if="activeTab === 'materials'">
          <el-form-item label="类型">
            <el-input v-model="formData.typeId" />
          </el-form-item>
          <el-form-item label="等级">
            <el-input-number v-model="formData.level" :min="1" />
          </el-form-item>
        </template>
        <template v-if="activeTab === 'potions'">
          <el-form-item label="效果类型">
            <el-input v-model="formData.effectType" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { raceApi, creatureApi, materialTypeApi, materialApi, potionApi } from '../api';

const activeTab = ref('races');
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formData = ref<any>({});

const races = ref<any[]>([]);
const creatures = ref<any[]>([]);
const materialTypes = ref<any[]>([]);
const materials = ref<any[]>([]);
const potions = ref<any[]>([]);

const loadData = async () => {
  try {
    switch (activeTab.value) {
      case 'races':
        const raceRes = await raceApi.list({});
        races.value = raceRes.data.data.items;
        break;
      case 'creatures':
        const creatureRes = await creatureApi.list({});
        creatures.value = creatureRes.data.data.items;
        break;
      case 'materialTypes':
        const materialTypeRes = await materialTypeApi.list({});
        materialTypes.value = materialTypeRes.data.data.items;
        break;
      case 'materials':
        const materialRes = await materialApi.list({});
        materials.value = materialRes.data.data.items;
        break;
      case 'potions':
        const potionRes = await potionApi.list({});
        potions.value = potionRes.data.data.items;
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
  dialogTitle.value = '编辑' + getTypeName(type);
  formData.value = { ...row };
  dialogVisible.value = true;
};

const handleDelete = async (type: string, row: any) => {
  try {
    switch (type) {
      case 'race':
        await raceApi.delete(row._id);
        break;
      case 'creature':
        await creatureApi.delete(row._id);
        break;
      case 'materialType':
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

const handleSave = async () => {
  try {
    const data = { ...formData.value };
    if (data._id) {
      switch (activeTab.value) {
        case 'races':
          await raceApi.update(data._id, data);
          break;
        case 'creatures':
          await creatureApi.update(data._id, data);
          break;
        case 'materialTypes':
          await materialTypeApi.update(data._id, data);
          break;
        case 'materials':
          await materialApi.update(data._id, data);
          break;
        case 'potions':
          await potionApi.update(data._id, data);
          break;
      }
    } else {
      switch (activeTab.value) {
        case 'races':
          await raceApi.create(data);
          break;
        case 'creatures':
          await creatureApi.create(data);
          break;
        case 'materialTypes':
          await materialTypeApi.create(data);
          break;
        case 'materials':
          await materialApi.create(data);
          break;
        case 'potions':
          await potionApi.create(data);
          break;
      }
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    race: '种族',
    creature: '生物',
    materialType: '材料类型',
    material: '材料',
    potion: '药品',
  };
  return typeMap[type] || '';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.data-list {
  padding: 16px;
}

:deep(.el-tabs__content) {
  padding: 16px 0;
}

:deep(.el-table) {
  margin-top: 8px;
}
</style> 