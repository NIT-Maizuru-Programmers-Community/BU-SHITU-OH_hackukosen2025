<template>
  <div class="game-ui">
    <!-- ヘッダー -->
    <header class="header">
      <div class="header-left">
        <div class="title-box">
          <span class="emoji">🎉</span>
          <span class="title-text">部★室★王</span>
          <span class="emoji">🎉</span>
        </div>
      </div>
      <div class="header-center">
        <div class="current-king">
          <span class="king-label">👑 現在の部室王</span>
          <span class="king-name">チャレンジ中...</span>
        </div>
      </div>
      <div class="header-right">
        <div class="clock">
          <span class="time">{{ currentTime }}</span>
          <span class="date">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
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
          <h2 class="ranking-title">🏆 TASK</h2>
          <div class="ranking-list">
            <div
              v-for="(task, index) in tasks"
              :key="task.id"
              :class="['ranking-item', `rank-${index + 1}`, { completed: task.completed }]"
            >
              <div class="rank-number">{{ index + 1 }}</div>
              <div class="rank-info">
                <span class="rank-name">{{ task.name }}</span>
              </div>
              <div class="rank-status">
                <span v-if="task.completed" class="status-clear">CLEAR!</span>
                <span v-else class="status-locked">---</span>
              </div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ImageGrid from '../components/ImageGrid.vue'
import { useTaskStore } from '../stores/taskStore'
import { storeToRefs } from 'pinia'

const taskStore = useTaskStore()
const { tasks, completedCount, progressPercentage, currentCount } = storeToRefs(taskStore)

const currentTime = ref('')
const currentDate = ref('')
let timeInterval: number | null = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  currentDate.value = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.game-ui {
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* ヘッダー */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  border-bottom: 4px solid #00cc66;
  position: relative;
}

.header::before {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    #00cc66 0px,
    #00cc66 20px,
    #004d26 20px,
    #004d26 40px
  );
}

.header-left {
  flex: 1;
}

.title-box {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00cc66 0%, #009944 100%);
  padding: 0.5rem 1.5rem;
  clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
}

.emoji {
  font-size: 1.5rem;
}

.title-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 2px 2px 0 #004d26;
  letter-spacing: 0.1em;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.current-king {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #333 0%, #1a1a1a 100%);
  padding: 0.5rem 2rem;
  border: 2px solid #00cc66;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}

.king-label {
  font-size: 0.75rem;
  color: #00cc66;
  font-weight: 600;
}

.king-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.time {
  font-size: 2rem;
  font-weight: 700;
  color: #00cc66;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(0, 204, 102, 0.5);
}

.date {
  font-size: 0.9rem;
  color: #888;
  font-weight: 600;
}

/* メインコンテンツ */
.main-content {
  flex: 1;
  display: flex;
  padding: 1rem;
  gap: 1rem;
  overflow: hidden;
}

/* 左パネル：ステータス＆アートパネル */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ステータスパネル */
.status-panel {
  background: #111;
  border: 3px solid #00cc66;
}

.status-header {
  background: #00cc66;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  font-size: 1rem;
}

.status-title {
  font-size: 1rem;
  font-weight: 700;
  color: #000;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.status-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1a1a1a;
  border-left: 4px solid #00cc66;
}

.status-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.05em;
}

.status-value {
  font-size: 2rem;
  font-weight: 700;
  color: #00cc66;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(0, 204, 102, 0.5);
}

.progress-section {
  background: #1a1a1a;
  padding: 1rem;
  border-left: 4px solid #ffd700;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label span:first-child {
  font-size: 0.9rem;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.05em;
}

.progress-percent {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Courier New', monospace;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #333;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  transition: width 0.3s ease;
}

.progress-detail {
  font-size: 0.85rem;
  color: #666;
  text-align: right;
  font-family: 'Courier New', monospace;
}

/* 中央パネル：アートパネル */
.center-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* アートパネルフレーム */
.art-panel-frame {
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  border: 3px solid #00cc66;
  max-width: 550px;
}

.art-panel-label {
  background: #00cc66;
  color: #000;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.art-panel-frame :deep(.image-grid-container) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
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

.ranking-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid #444;
  transition: all 0.3s ease;
}

.ranking-item.rank-1 {
  border-left-color: #ffd700;
}
.ranking-item.rank-2 {
  border-left-color: #c0c0c0;
}
.ranking-item.rank-3 {
  border-left-color: #cd7f32;
}
.ranking-item.rank-4 {
  border-left-color: #00cc66;
}
.ranking-item.rank-5 {
  border-left-color: #0099cc;
}
.ranking-item.rank-6 {
  border-left-color: #9933cc;
}

.ranking-item.completed {
  background: rgba(0, 204, 102, 0.1);
  border-left-width: 6px;
}

.rank-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  background: #333;
}

.rank-1 .rank-number {
  background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
  color: #000;
}
.rank-2 .rank-number {
  background: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
  color: #000;
}
.rank-3 .rank-number {
  background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
  color: #fff;
}
.rank-4 .rank-number {
  background: linear-gradient(135deg, #00cc66 0%, #009944 100%);
}
.rank-5 .rank-number {
  background: linear-gradient(135deg, #0099cc 0%, #006699 100%);
}
.rank-6 .rank-number {
  background: linear-gradient(135deg, #9933cc 0%, #660099 100%);
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.rank-status {
  text-align: right;
}

.status-clear {
  font-size: 1rem;
  font-weight: 700;
  color: #00cc66;
  text-shadow: 0 0 8px rgba(0, 204, 102, 0.5);
}

.status-locked {
  font-size: 1rem;
  color: #555;
  font-weight: 600;
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

  .header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header-center {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
