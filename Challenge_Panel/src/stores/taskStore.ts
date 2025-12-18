import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Task {
  id: number
  name: string
  completed: boolean
  imageName: string
  unlockCount: number
}

export const useTaskStore = defineStore('task', () => {
  const TOTAL_TASKS = 6
  // 開発環境ではプロキシを使用、本番環境では直接アクセス
  const API_BASE_URL = '/api/attendance/today-count'
  const HARDWARE_API_KEY = 'Procon2025'

  // 6つの画像に対応するタスク（縦3×横2のグリッド配置）
  // 各タスクに解放されるカウント数を設定
  const imageFiles = [
    { name: '1.jpg', label: '部室に1人来る', unlockCount: 1 }, // count=1で解放
    { name: '2.jpg', label: '部室に3人来る', unlockCount: 3 }, // count=3で解放
    { name: '3.jpg', label: '部室に4人来る', unlockCount: 4 }, // count=4で解放
    { name: '4.jpg', label: '部室に6人来る', unlockCount: 6 }, // count=6で解放
    { name: '5.jpg', label: '部室に9人来る', unlockCount: 9 }, // count=9で解放
    { name: '6.jpg', label: '部室に12人来る', unlockCount: 12 }, // count=12で解放
  ]

  // タスクの初期化
  const tasks = ref<Task[]>(
    imageFiles.map((file, index) => ({
      id: index,
      name: file.label,
      completed: false,
      imageName: file.name,
      unlockCount: file.unlockCount,
    })),
  )

  const currentCount = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const lastFetchTime = ref<number>(0)

  // 完了済みタスクの数
  const completedCount = computed(() => tasks.value.filter((task) => task.completed).length)

  // 進捗率
  const progressPercentage = computed(() => Math.round((completedCount.value / TOTAL_TASKS) * 100))

  // APIからカウントを取得
  const fetchCount = async () => {
    // 5秒以内の再取得を防ぐ
    const now = Date.now()
    if (now - lastFetchTime.value < 5000) {
      console.log('⏳ API呼び出しをスキップ（5秒以内）')
      return
    }

    isLoading.value = true
    lastFetchTime.value = now

    console.log('🔄 APIを呼び出し中...', API_BASE_URL)

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': HARDWARE_API_KEY,
        },
      })

      console.log('📡 APIレスポンス:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 受信データ:', data)

      if (data.success && typeof data.count === 'number') {
        currentCount.value = data.count
        console.log('✅ カウント更新:', data.count)
        updateTasksByCount(data.count)
      } else {
        console.warn('⚠️ データ形式が不正:', data)
      }
    } catch (error) {
      console.error('❌ APIからのデータ取得に失敗:', error)
    } finally {
      isLoading.value = false
    }
  }

  // カウントに基づいてタスクを自動解放
  const updateTasksByCount = (count: number) => {
    console.log('🔓 タスク解放チェック - カウント:', count)
    let unlockedCount = 0
    tasks.value.forEach((task) => {
      const wasCompleted = task.completed
      if (count >= task.unlockCount) {
        task.completed = true
        if (!wasCompleted) {
          console.log(`  ✨ 解放: ${task.name} (必要カウント: ${task.unlockCount})`)
          unlockedCount++
        }
      }
    })
    if (unlockedCount > 0) {
      console.log(`🎉 ${unlockedCount}個のタスクが新たに解放されました！`)
    } else {
      console.log('  既に解放済みまたは未達成')
    }
  }

  // タスクの完了状態を切り替え（手動操作用）
  const toggleTask = (taskId: number) => {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.completed = !task.completed
    }
  }

  // タスク名を更新
  const updateTaskName = (taskId: number, newName: string) => {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.name = newName
    }
  }

  // すべてのタスクをリセット
  const resetAllTasks = () => {
    tasks.value.forEach((task) => {
      task.completed = false
    })
    currentCount.value = 0
  }

  return {
    tasks,
    completedCount,
    progressPercentage,
    currentCount,
    isLoading,
    TOTAL_TASKS,
    fetchCount,
    toggleTask,
    updateTaskName,
    resetAllTasks,
  }
})
