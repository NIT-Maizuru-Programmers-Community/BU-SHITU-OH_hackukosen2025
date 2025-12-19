// Simple Event Bus for Vue 3
import { ref } from 'vue'

const listeners = ref(new Map())

export const eventBus = {
  // イベントを発火
  emit(event, data) {
    const callbacks = listeners.value.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  },
  
  // イベントをリッスン
  on(event, callback) {
    if (!listeners.value.has(event)) {
      listeners.value.set(event, [])
    }
    listeners.value.get(event).push(callback)
  },
  
  // リスナーを解除
  off(event, callback) {
    const callbacks = listeners.value.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
}
