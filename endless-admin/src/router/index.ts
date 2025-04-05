import { createRouter, createWebHistory } from 'vue-router';
import DataList from '../views/DataList.vue';

const router = createRouter({
  history: createWebHistory('/endless/admin/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DataList,
    },
  ],
});

export default router; 