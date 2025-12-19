<template>
  <div class="image-grid-container">
    <div class="canvas-wrapper">
      <canvas ref="canvasRef" class="grid-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const canvasRef = ref(null)
const images = ref(new Map())
let imagesLoaded = 0
const GRID_COLS = 3 // 横3列
const GRID_ROWS = 3 // 縦3行

onMounted(() => {
  loadAllImages()
})

// タスクの完了状態が変わったら再描画
watch(
  () => props.tasks,
  () => {
    drawGrid()
  },
  { deep: true }
)

// 9つの画像を読み込み
const loadAllImages = () => {
  for (let i = 1; i <= 9; i++) {
    const img = new Image()
    img.src = new URL(`../../assets/artpanel/${i}.png`, import.meta.url).href
    img.onload = () => {
      images.value.set(`${i}.png`, img)
      imagesLoaded++
      if (imagesLoaded === 9) {
        // 全ての画像が読み込み完了
        setTimeout(() => {
          drawGrid()
        }, 100)
      }
    }
    img.onerror = (error) => {
      console.error(`画像の読み込みに失敗: ${i}.png`, error)
    }
  }
}

// グリッドを描画
const drawGrid = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Canvasのサイズを親コンテナに合わせて調整
  const containerSize = Math.min(350, window.innerHeight * 0.4)
  canvas.width = containerSize
  canvas.height = containerSize

  const cellWidth = containerSize / GRID_COLS
  const cellHeight = containerSize / GRID_ROWS

  // 背景をクリア
  ctx.clearRect(0, 0, containerSize, containerSize)

  // 9つのセルを描画
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col
      const task = props.tasks[index]
      
      if (task) {
        const x = col * cellWidth
        const y = row * cellHeight

        const img = images.value.get(task.imageName)
        if (img) {
          // 画像を描画
          ctx.drawImage(img, x, y, cellWidth, cellHeight)

          // 未完了の場合はオーバーレイを表示
          if (!task.completed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(x, y, cellWidth, cellHeight)

            // ロックアイコン
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = '32px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🔒', x + cellWidth / 2, y + cellHeight / 2)
          }
        }

        // グリッド線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, cellWidth, cellHeight)
      }
    }
  }
}
</script>

<style scoped>
.image-grid-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas-wrapper {
  position: relative;
  border: 3px solid #a855f7;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.8);
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
}

.grid-canvas {
  display: block;
  border-radius: 9px;
}
</style>