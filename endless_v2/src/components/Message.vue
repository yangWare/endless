<template>
  <Modal v-model:visible="visible" :allow-close="allowClose">
    <div class="message-container">
      <div class="message-content" v-html="content"></div>
      <div v-if="showButton" class="message-actions">
        <button class="action-button" @click="handleAction">
          {{ buttonText }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'

interface MessageProps {
  content: string
  visible: boolean
  showButton?: boolean
  buttonText?: string
  allowClose?: boolean
}

const props = withDefaults(defineProps<MessageProps>(), {
  visible: false,
  showButton: false,
  buttonText: '确定',
  allowClose: true
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'action'): void
}>()

const handleAction = (): void => {
  emit('action')
  emit('update:visible', false)
}

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    if (!props.allowClose && !value) return
    emit('update:visible', value)
  },
})
</script>

<style scoped>
.message-container {
  padding: 12px 20px;
  min-width: 280px;
  animation: slide-in 0.3s ease;
  color: #a0aec0;
}

.message-content {
  font-size: 14px;
}

.message-actions {
  margin-top: 16px;
  text-align: center;
}

.action-button {
  background-color: #4a5568;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #2d3748;
}

@keyframes slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
