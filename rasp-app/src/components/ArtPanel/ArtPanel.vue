<template>
  <div class="art-panel-content">
    <!-- 中央：アートパネル -->
    <section class="center-panel">
      <div class="art-panel-frame">
        <div class="art-panel-label">🎨 ART PANEL</div>
        <ImageGrid :tasks="tasks" />
      </div>
    </section>

    <!-- 右側：タスク＆ステータス -->
    <section class="right-panel">
      <!-- タスクパネル -->
      <div class="task-panel">
        <h2 class="task-title">🎯 NEXT TASK</h2>
        <div class="next-task-display">
          <!-- 全タスククリア済み -->
          <div v-if="!nextTask" class="all-clear">
            <span class="all-clear-icon">🎉</span>
            <span class="all-clear-text">ALL CLEAR!</span>
            <span class="all-clear-sub">おめでとうございます！</span>
          </div>
          <!-- 次のタスク表示 -->
          <div v-else class="next-task-card">
            <div class="next-task-number">{{ nextTask.id + 1 }}</div>
            <div class="next-task-info">
              <span class="next-task-label">MISSION</span>
              <span class="next-task-name">{{ nextTask.name }}</span>
            </div>
            <div class="next-task-requirement">
              <span class="requirement-label">NEED</span>
              <span class="requirement-value">{{ nextTask.unlockCount }}人</span>
            </div>
          </div>
        </div>
        <!-- 進捗表示 -->
        <div class="task-progress">
          <span class="progress-text">{{ completedCount }} / {{ tasks.length }} CLEAR</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- ステータスパネル -->
      <div class="status-panel">
        <div class="status-header">📊 STATUS</div>
        <div class="status-content">
          <div class="status-item">
            <span class="status-label">今日の来室者数</span>
            <span class="status-value">{{ currentCount }}人</span>
          </div>
          <div class="status-item">
            <span class="status-label">進捗率</span>
            <span class="status-value">{{ progressPercentage }}%</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ImageGrid from './ImageGrid.vue'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

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

const currentCount = ref(0)
let intervalId = null

// Computed properties
const completedCount = computed(() => tasks.value.filter(task => task.completed).length)
const progressPercentage = computed(() => Math.round((completedCount.value / tasks.value.length) * 100))
const nextTask = computed(() => tasks.value.find(task => !task.completed))

// 来室者数を取得
const fetchAttendanceCount = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/attendance/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    currentCount.value = result.data?.count || 0
    
    // タスクの完了状態を更新
    updateTasksByCount()
    
    console.log('Attendance count fetched:', currentCount.value)
  } catch (error) {
    console.error('Failed to fetch attendance count:', error)
    // エラー時はランダムな値を使用（開発時のため）
    currentCount.value = Math.floor(Math.random() * 10)
    updateTasksByCount()
  }
}

// カウントに基づいてタスクの完了状態を更新
const updateTasksByCount = () => {
  tasks.value.forEach(task => {
    task.completed = currentCount.value >= task.unlockCount
  })
}

onMounted(() => {
  // 初回取得
  fetchAttendanceCount()
  
  // 30秒ごとに更新
  intervalId = setInterval(fetchAttendanceCount, 30000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.art-panel-content {
  display: flex;
  width: 100%;
  max-width: 1200px;
  gap: 3rem;
  padding: 2rem;
  margin: 0 auto;
}

.center-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.art-panel-frame {
  text-align: center;
}

.art-panel-label {
  font-size: 2rem;
  font-weight: 900;
  color: #00ff88;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  font-family: 'Russo One', monospace;
}

.right-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.task-panel, .status-panel {
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #00ff88;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
}

.task-title, .status-header {
  font-size: 1.5rem;
  font-weight: 900;
  color: #00ff88;
  text-shadow: 0 0 15px rgba(0, 255, 136, 0.8);
  margin-bottom: 1rem;
  text-align: center;
  font-family: 'Russo One', monospace;
}

.next-task-display {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.all-clear {
  text-align: center;
  animation: bounce 2s infinite;
}

.all-clear-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.all-clear-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  display: block;
  font-family: 'Russo One', monospace;
}

.all-clear-sub {
  font-size: 0.9rem;
  color: #ffffff;
  margin-top: 0.5rem;
  display: block;
}

.next-task-card {
  width: 100%;
  background: rgba(0, 255, 136, 0.1);
  border: 2px solid #00ff88;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.next-task-number {
  font-size: 2rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  font-family: 'Russo One', monospace;
}

.next-task-label {
  font-size: 0.8rem;
  color: #00ff88;
  font-weight: bold;
  display: block;
  margin-top: 0.5rem;
}

.next-task-name {
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: bold;
  display: block;
  margin: 0.3rem 0;
}

.requirement-label {
  font-size: 0.8rem;
  color: #ff6b6b;
  font-weight: bold;
  display: block;
  margin-top: 0.8rem;
}

.requirement-value {
  font-size: 1.2rem;
  color: #ff6b6b;
  font-weight: 900;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
  font-family: 'Russo One', monospace;
}

.task-progress {
  margin-top: 1.5rem;
  text-align: center;
}

.progress-text {
  color: #ffffff;
  font-weight: bold;
  font-size: 1rem;
  display: block;
  margin-bottom: 0.8rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc66);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 6px;
}

.status-label {
  color: #ffffff;
  font-weight: bold;
  font-size: 0.9rem;
}

.status-value {
  color: #00ff88;
  font-weight: 900;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
  font-family: 'Russo One', monospace;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* レスポンシブ対応 */
@media (max-width: 1024px) {
  .art-panel-content {
    flex-direction: column;
    align-items: center;
  }
  
  .right-panel {
    width: 100%;
    max-width: 500px;
  }
}
</style>