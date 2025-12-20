<template>
  <div class="main-content">
    <!-- 中央：アートパネル -->
    <section class="center-panel">
      <div class="art-panel-frame">
        <div class="art-panel-label">ART PANEL</div>
        <ImageGrid />
      </div>
    </section>

    <!-- 右側：タスク＆ステータス -->
    <section class="right-panel">
      <!-- タスクパネル -->
      <div class="ranking-panel">
        <h2 class="ranking-title">🏆 NEXT TASK</h2>
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
        </div>
      </div>

      <!-- ステータスパネル（小さく） -->
      <div class="status-panel-mini">
        <div class="status-mini-header">📊 STATUS</div>
        <div class="status-mini-content">
          <div class="status-mini-item">
            <span class="status-mini-label">COUNT</span>
            <span class="status-mini-value">{{ currentCount }}</span>
          </div>
          <div class="status-mini-item">
            <span class="status-mini-label">PROGRESS</span>
            <span class="status-mini-value">{{ progressPercentage }}%</span>
          </div>
          <div class="progress-bar-mini">
            <div class="progress-fill-mini" :style="{ width: `${progressPercentage}%` }"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ImageGrid from '../components/ImageGrid.vue'
import { useTaskStore } from '../stores/taskStore'
import { storeToRefs } from 'pinia'

const taskStore = useTaskStore()
const { tasks, completedCount, progressPercentage, currentCount } = storeToRefs(taskStore)

// 次にクリアすべきタスクを取得
const nextTask = computed(() => {
  return tasks.value.find((task) => !task.completed) || null
})
</script>

<style scoped>
/* メインコンテンツ */
.main-content {
  flex: 1;
  display: flex;
  padding: 1rem;
  gap: 1rem;
  overflow: hidden;
}

/* 中央パネル：アートパネル */
.center-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* アートパネルフレーム */
.art-panel-frame {
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  border: 4px solid #00cc66;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 0 30px rgba(0, 204, 102, 0.2);
}

.art-panel-label {
  background: #00cc66;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.6rem 1.2rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
}

.art-panel-frame :deep(.image-grid-container) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

/* 右パネル：タスク＆ステータス */
.right-panel {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ランキングパネル */
.ranking-panel {
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 3px solid #00cc66;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ranking-title {
  background: linear-gradient(135deg, #00cc66 0%, #009944 100%);
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  padding: 1rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-shadow: 2px 2px 0 #004d26;
}

/* 次のタスク表示 */
.next-task-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.all-clear {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.all-clear-icon {
  font-size: 4rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.all-clear-text {
  font-size: 2rem;
  font-weight: 700;
  color: #00cc66;
  text-shadow: 0 0 20px rgba(0, 204, 102, 0.5);
  letter-spacing: 0.1em;
}

.all-clear-sub {
  font-size: 1rem;
  color: #888;
}

.next-task-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 204, 102, 0.05);
  border: 2px solid #00cc66;
}

.next-task-number {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #000;
  background: linear-gradient(135deg, #00cc66 0%, #009944 100%);
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.4);
}

.next-task-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.next-task-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.1em;
}

.next-task-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
}

.next-task-requirement {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  border-left: 4px solid #ffd700;
}

.requirement-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.05em;
}

.requirement-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Courier New', monospace;
}

.task-progress {
  background: #111;
  padding: 0.75rem;
  text-align: center;
  border-top: 1px solid #333;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #00cc66;
  letter-spacing: 0.05em;
  font-family: 'Courier New', monospace;
}

/* ミニステータスパネル */
.status-panel-mini {
  background: #111;
  border: 2px solid #00cc66;
}

.status-mini-header {
  background: #00cc66;
  color: #000;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  letter-spacing: 0.1em;
}

.status-mini-content {
  padding: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.status-mini-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #1a1a1a;
  border-left: 3px solid #00cc66;
}

.status-mini-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.05em;
}

.status-mini-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #00cc66;
  font-family: 'Courier New', monospace;
}

.progress-bar-mini {
  flex: 1;
  min-width: 100px;
  height: 8px;
  background: #333;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  transition: width 0.3s ease;
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .right-panel {
    width: 100%;
  }

  .ranking-list {
    max-height: 300px;
  }
}
</style>
