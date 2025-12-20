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
    <MainView />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MainView from './MainView.vue'

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

@media (max-width: 1024px) {
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
