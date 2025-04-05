import { createRouter, createWebHistory } from 'vue-router';
import DataList from '../views/DataList.vue';
import CreateView from '../views/CreateView.vue';
import EditView from '../views/EditView.vue';

const router = createRouter({
  history: createWebHistory('/endless/admin/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DataList,
    },
    {
      path: '/create',
      name: 'Create',
      component: CreateView,
    },
    {
      path: '/edit/:id',
      name: 'Edit',
      component: EditView,
    },
  ],
});

export default router; 