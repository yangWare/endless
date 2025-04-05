<script setup lang="ts"></script>

<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.app-container {
  min-height: 100vh;
}
</style>
