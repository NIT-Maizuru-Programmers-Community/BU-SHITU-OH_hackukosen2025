<template>
  <div class="art-panel-inline">
    <div class="art-panel-grid">
      <ImageGrid :tasks="tasks" />
    </div>
    
    <!-- Status Info -->
    <div class="art-panel-status">
      <div class="status-row">
        <span class="status-label">🎯 進捗</span>
        <span class="status-value">{{ completedCount }}/{{ tasks.length }}</span>
        <span class="status-percent">({{ progressPercentage }}%)</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div v-if="nextTask" class="next-task">
        <span class="next-label">NEXT:</span>
        <span class="next-name">{{ nextTask.name }}</span>
        <span class="next-count">あと{{ nextTask.unlockCount - currentCount }}人</span>
      </div>
      <div v-else class="all-clear">
        <span class="all-clear-text">🎉 ALL CLEAR!</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ImageGrid from './ImageGrid.vue'
import { eventBus } from '../../utils/eventBus.js'

// タスク定義
const tasks = ref([
  { id: 0, name: '最初の来訪者', completed: false, imageName: '1.png', unlockCount: 1 },
  { id: 1, name: '常連への道', completed: false, imageName: '2.png', unlockCount: 2 },
  { id: 2, name: '部室の住人', completed: false, imageName: '3.png', unlockCount: 3 },
  { id: 3, name: '中堅メンバー', completed: false, imageName: '4.png', unlockCount: 4 },
  { id: 4, name: 'ベテラン部員', completed: false, imageName: '5.png', unlockCount: 5 },
  { id: 5, name: '部室マスター', completed: false, imageName: '6.png', unlockCount: 6 },
  { id: 6, name: '伝説の始まり', completed: false, imageName: '7.png', unlockCount: 7 },
  { id: 7, name: '部室の守護者', completed: false, imageName: '8.png', unlockCount: 8 },
  { id: 8, name: '部室王', completed: false, imageName: '9.png', unlockCount: 9 },
])

// 現在の解放数（ログイン回数ベース）
const unlockedCount = ref(0)

// Computed properties
const completedCount = computed(() => tasks.value.filter(task => task.completed).length)
const progressPercentage = computed(() => Math.round((completedCount.value / tasks.value.length) * 100))
const nextTask = computed(() => tasks.value.find(task => !task.completed))
// 互換性のためにcurrentCountを維持
const currentCount = computed(() => unlockedCount.value)

// ログイン成功時にパネルを解放
const onLoginSuccess = () => {
  // 9枚全て解放済みの場合はリセット
  if (unlockedCount.value >= 9) {
    unlockedCount.value = 1
    console.log('Art Panel: All panels were unlocked, resetting to 1')
  } else {
    unlockedCount.value++
    console.log('Art Panel: Panel unlocked, count:', unlockedCount.value)
  }
  
  // タスクの完了状態を更新
  updateTasksByUnlockedCount()
  
  // localStorageに保存
  localStorage.setItem('artPanelUnlockedCount', unlockedCount.value.toString())
}

// 解放数に基づいてタスクの完了状態を更新
const updateTasksByUnlockedCount = () => {
  tasks.value.forEach(task => {
    task.completed = unlockedCount.value >= task.unlockCount
  })
}

// localStorageから解放状態を復元
const loadUnlockedCount = () => {
  const saved = localStorage.getItem('artPanelUnlockedCount')
  if (saved) {
    unlockedCount.value = parseInt(saved, 10) || 0
    updateTasksByUnlockedCount()
    console.log('Art Panel: Loaded unlocked count from storage:', unlockedCount.value)
  }
}

onMounted(() => {
  // localStorageから復元
  loadUnlockedCount()
  
  // ログイン成功イベントをリッスン
  eventBus.on('login-success', onLoginSuccess)
})

onUnmounted(() => {
  // イベントリスナーを解除
  eventBus.off('login-success', onLoginSuccess)
})
</script>

<style scoped>
.art-panel-inline {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  gap: 0.5rem;
}

.art-panel-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-shrink: 0;
}

.art-panel-status {
  width: 180px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #a855f7;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
}

.status-label {
  color: #a855f7;
  font-weight: bold;
  font-size: 1rem;
}

.status-value {
  color: #ffffff;
  font-weight: 900;
  font-size: 1.2rem;
  font-family: 'Russo One', monospace;
}

.status-percent {
  color: #a855f7;
  font-weight: bold;
  font-size: 0.9rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(168, 85, 247, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #7c3aed);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
}

.next-task {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.next-label {
  color: #f472b6;
  font-weight: bold;
}

.next-name {
  color: #ffffff;
  font-weight: 600;
}

.next-count {
  color: #fbbf24;
  font-weight: bold;
  font-size: 0.9rem;
}

.all-clear {
  text-align: center;
}

.all-clear-text {
  color: #ffd700;
  font-weight: 900;
  font-size: 1.1rem;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}
</style>