<template>
  <div class="image-grid-container">
    <div class="canvas-wrapper">
      <canvas ref="canvasRef" @click="handleCanvasClick" class="grid-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { storeToRefs } from 'pinia'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const taskStore = useTaskStore()
const { tasks, completedCount, progressPercentage, currentCount } = storeToRefs(taskStore)

// 9つの画像を格納
const images = ref<Map<string, HTMLImageElement>>(new Map())
let imagesLoaded = 0
const GRID_COLS = 3 // 横3列
const GRID_ROWS = 3 // 縦3行
let intervalId: number | null = null

onMounted(() => {
  loadAllImages()

  // 初回のAPI呼び出し
  taskStore.fetchCount()

  // 10秒ごとにAPIを呼び出す
  intervalId = window.setInterval(() => {
    taskStore.fetchCount()
  }, 10000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

// タスクの完了状態が変わったら再描画
watch(
  tasks,
  () => {
    drawGrid()
  },
  { deep: true },
)

const loadAllImages = () => {
  tasks.value.forEach((task) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = new URL(`../assets/${task.imageName}`, import.meta.url).href

    img.onload = () => {
      images.value.set(task.imageName, img)
      imagesLoaded++

      if (imagesLoaded === tasks.value.length) {
        initCanvas()
      }
    }

    img.onerror = () => {
      console.error(`画像の読み込みに失敗: ${task.imageName}`)
    }
  })
}

const initCanvas = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value

  // レスポンシブなキャンバスサイズを設定（縦3行×横2列のグリッド）
  // 画面幅に応じて調整
  const maxWidth = Math.min(window.innerWidth - 100, 800)
  const cellWidth = maxWidth / GRID_COLS
  const cellHeight = cellWidth * 0.85 // アスペクト比を保持

  canvas.width = cellWidth * GRID_COLS
  canvas.height = cellHeight * GRID_ROWS

  drawGrid()
}

// ウィンドウリサイズ時に再描画
const handleResize = () => {
  if (images.value.size === tasks.value.length) {
    initCanvas()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

watch(
  () => {},
  () => {
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  },
)

const drawGrid = () => {
  if (!canvasRef.value || images.value.size === 0) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cellWidth = canvas.width / GRID_COLS
  const cellHeight = canvas.height / GRID_ROWS

  // 背景をクリア
  ctx.fillStyle = '#ecf0f1'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 各タスクに対応する画像を描画（3列×2行のグリッド）
  tasks.value.forEach((task, index) => {
    const col = index % GRID_COLS
    const row = Math.floor(index / GRID_COLS)
    const x = col * cellWidth
    const y = row * cellHeight

    const img = images.value.get(task.imageName)
    if (img && img.complete) {
      // 画像をセルサイズに合わせて描画
      ctx.drawImage(img, x, y, cellWidth, cellHeight)

      // 未完了のタスクには暗いオーバーレイを追加（シルエット効果）
      if (!task.completed) {
        ctx.fillStyle = 'rgba(100, 120, 140, 0.85)'
        ctx.fillRect(x, y, cellWidth, cellHeight)
      }
    }
  })

  // グリッド線を描画（太く目立つように）
  tasks.value.forEach((task, index) => {
    const col = index % GRID_COLS
    const row = Math.floor(index / GRID_COLS)
    const x = col * cellWidth
    const y = row * cellHeight

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(x, y, cellWidth, cellHeight)
  })
}

const handleCanvasClick = (event: MouseEvent) => {
  // 画像クリックでタスククリアしないように無効化
  return
}

const resetTasks = () => {
  if (confirm('すべてのタスクをリセットしますか？')) {
    taskStore.resetAllTasks()
  }
}
</script>

<style scoped>
.image-grid-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.canvas-wrapper {
  width: 100%;
  max-width: 580px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #00cc66;
  overflow: hidden;
  background: #000;
}

.grid-canvas {
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  cursor: default;
  display: block;
}
</style>
