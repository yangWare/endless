<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ModalProps {
  visible: boolean
  allowClose?: boolean
}

const props = withDefaults(defineProps<ModalProps>(), {
  visible: false,
  allowClose: true
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const handleOverlayClick = (): void => {
  if (props.allowClose) {
    emit('update:visible', false)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #e0e0e0;
  border: 2px solid #404040;
}
</style>
