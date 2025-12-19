<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Import audio files
import timerSound from './timer.mp3'
import musicSound from './music.mp3'

const currentTime = ref('')
const currentDate = ref('')
const modal = ref({ show: false, title: '' })

// WebSocket connection
let ws = null
const wsConnected = ref(false)

// Login flow state
const loginState = ref({
  show: false,
  step: 'select', // 'select' | 'complete' | 'waiting' | 'result'
  selectedBet: null,
  nfcWaiting: false,
  loginResult: null
})

// Race state
const raceState = ref({
  show: false,
  phase: 'countdown', // 'countdown' | 'racing' | 'result'
  countdown: 3,
  raceTime: 0,
  results: []
})

// Register state
const registerState = ref({
  show: false,
  step: 'waiting', // 'waiting' | 'qr' | 'complete' | 'error'
  qrUrl: null,
  registrationId: null,
  expiresIn: null,
  error: null
})

// Audio refs
let timerAudio = null
let musicAudio = null

// Race participants (using betOptions as racers)
const racers = [
  { id: 1, icon: '🇨', name: 'C言語', color: 'from-blue-700 to-blue-500', progress: 0 },
  { id: 2, icon: '🐍', name: 'Python', color: 'from-yellow-500 to-green-500', progress: 0 },
  { id: 3, icon: '🟨', name: 'JavaScript', color: 'from-yellow-400 to-yellow-300', progress: 0 }
]

// Points by ranking
const pointsByRank = [1000, 500, 100]

// Bet options
const betOptions = [
  { id: 1, icon: '🇨', name: 'C言語', color: 'from-blue-700 to-blue-500', border: 'border-blue-500' },
  { id: 2, icon: '🐍', name: 'Python', color: 'from-yellow-500 to-green-500', border: 'border-green-400' },
  { id: 3, icon: '🟨', name: 'JavaScript', color: 'from-yellow-400 to-yellow-300', border: 'border-yellow-400' }
]

let timer
let raceTimer = null
let countdownTimer = null

// API Configuration (環境変数から読み込み)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Ranking Data
const rankingData = ref([])
const rankingLoading = ref(false)
const rankingError = ref(null)

// Attendance Data
const attendanceCount = ref(0)
const attendanceLoading = ref(false)
const attendanceError = ref(null)

// ランキング取得（FastAPIバックエンド経由）
const fetchRanking = async (limit = 10) => {
  rankingLoading.value = true
  rankingError.value = null
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/ranking?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.ranking) {
      rankingData.value = result.ranking.map(item => ({
        rank: item.rank,
        name: item.displayName,
        points: item.totalPoints,
        isPresident: item.isPresident
      }))
      console.log('Ranking fetched:', rankingData.value)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Failed to fetch ranking:', error)
    rankingError.value = error.message
    // フォールバック用のダミーデータ
    rankingData.value = [
      { rank: 1, name: 'データ取得中...', points: 0, isPresident: false }
    ]
  } finally {
    rankingLoading.value = false
  }
}

const eventData = ref([
  { date: '01/15', title: 'LT会', bonus: 'x2.0' },
  { date: '01/20', title: '全体MTG', bonus: 'x1.5' },
  { date: '02/01', title: '部内ハッカソン', bonus: 'x3.0' },
  { date: '02/15', title: '低学年PJお披露目会', bonus: 'x2.5' },
])

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  currentDate.value = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`
}

// 今日のログイン人数取得
const fetchAttendanceCount = async () => {
  attendanceLoading.value = true
  attendanceError.value = null
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/attendance/today-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      attendanceCount.value = result.data.count || 0
      console.log('Attendance count fetched:', attendanceCount.value)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Failed to fetch attendance count:', error)
    attendanceError.value = error.message
    attendanceCount.value = 0
  } finally {
    attendanceLoading.value = false
  }
}

// ベット情報をバックエンドに保存
const saveBetToBackend = async (betInfo) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(betInfo)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Bet saved to backend:', result)
    return result
  } catch (error) {
    console.error('Failed to save bet to backend:', error)
    throw error
  }
}

// レース結果をFirebaseに送信
const submitRaceResult = async (results) => {
  try {
    // キャラクターIDのマッピング
    const characterIdMap = {
      'C言語': 'c',
      'Python': 'python',
      'JavaScript': 'javascript'
    }
    
    const characters = results.map(result => ({
      characterId: characterIdMap[result.name] || result.name.toLowerCase(),
      name: result.name,
      emoji: result.icon,
      rank: result.rank
    }))
    
    console.log('Submitting race result:', { characters })
    
    const response = await fetch(`${BACKEND_URL}/api/races/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        characters
        // betsはバックエンドのJSONファイルから取得
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server error response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Race result submitted successfully:', result)
    return result
  } catch (error) {
    console.error('Failed to submit race result:', error)
    throw error
  }
}

// 定期的にランキングと人数を更新（60秒ごと）
let rankingInterval = null
const startRankingPolling = () => {
  fetchRanking()
  fetchAttendanceCount()
  rankingInterval = setInterval(() => {
    fetchRanking()
    fetchAttendanceCount()
  }, 60000) // 60秒ごとに更新
}

const triggerAction = (actionName) => {
  console.log(`Action: ${actionName}`)
  if (actionName === 'Login') {
    // Open login flow with NFC waiting
    loginState.value = { 
      show: true, 
      step: 'waiting', 
      selectedBet: null,
      nfcWaiting: true,
      loginResult: null
    }
  } else if (actionName === 'Race') {
    // Start race
    startRace()
  } else if (actionName === 'Register') {
    // Open register screen and set mode to register
    registerState.value = {
      show: true,
      step: 'waiting',
      qrUrl: null,
      registrationId: null,
      expiresIn: null,
      error: null
    }
    // NFCモードを登録に変更
    setNFCMode('register')
  } else {
    modal.value = { show: true, title: actionName.toUpperCase() }
    setTimeout(() => { if(modal.value.show) closeModal() }, 1500)
  }
}

// WebSocket functions
const connectWebSocket = () => {
  const wsUrl = 'ws://localhost:8000/ws/nfc'
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('WebSocket接続成功')
    wsConnected.value = true
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('WebSocketメッセージ受信:', data)
    
    if (data.type === 'card_detected') {
      // NFCカード検出
      console.log('NFCカード検出:', data.cardId, 'モード:', data.mode)
    } else if (data.type === 'login_result') {
      // ログイン結果受信
      handleLoginResult(data)
    } else if (data.type === 'register_result') {
      // 登録結果受信
      handleRegisterResult(data)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocketエラー:', error)
    wsConnected.value = false
  }
  
  ws.onclose = () => {
    console.log('WebSocket切断')
    wsConnected.value = false
    
    // 5秒後に再接続を試みる
    setTimeout(() => {
      if (!wsConnected.value) {
        console.log('WebSocket再接続を試みます...')
        connectWebSocket()
      }
    }, 5000)
  }
}

const setNFCMode = async (mode) => {
  try {
    const response = await fetch('http://localhost:8000/api/set-nfc-mode?mode=' + mode, {
      method: 'POST'
    })
    if (response.ok) {
      console.log(`NFCモードを ${mode} に設定しました`)
    }
  } catch (error) {
    console.error('NFCモード設定エラー:', error)
  }
}

const handleLoginResult = (data) => {
  if (loginState.value.show && loginState.value.step === 'waiting') {
    if (data.success) {
      // ログイン成功 → ベット選択画面へ
      const user = data.data?.user || {}
      const bonus = data.data?.bonus || {}
      
      loginState.value.loginResult = {
        success: true,
        userId: user.userId || user.uid || 'unknown',
        userName: user.displayName || 'ゲスト',
        user: user,
        points: bonus.points || 0,
        totalPoints: user.totalPoints || 0,
        message: bonus.awarded ? 'ログインボーナス獲得！' : 'ログイン済み'
      }
      
      // ベット選択画面に遷移
      loginState.value.step = 'select'
    } else {
      // エラー
      loginState.value.step = 'result'
      loginState.value.loginResult = {
        success: false,
        error: data.error || '不明なエラー',
        code: data.code
      }
      
      // 3秒後に閉じる
      setTimeout(() => {
        if (loginState.value.show) {
          closeLoginModal()
        }
      }, 3000)
    }
  }
}

const handleRegisterResult = (data) => {
  if (registerState.value.show && registerState.value.step === 'waiting') {
    if (data.success) {
      // 登録成功 → QRコード表示
      const regData = data.data
      registerState.value.step = 'qr'
      registerState.value.qrUrl = regData.linkUrl
      registerState.value.registrationId = regData.registrationId
      registerState.value.expiresIn = regData.expiresIn
    } else {
      // エラー
      registerState.value.step = 'error'
      registerState.value.error = data.error || '不明なエラー'
      
      // 3秒後に閉じる
      setTimeout(() => {
        if (registerState.value.show) {
          closeRegister()
        }
      }, 3000)
    }
  }
}

// Race functions
const startRace = () => {
  // Reset race state
  raceState.value = {
    show: true,
    phase: 'countdown',
    countdown: 3,
    raceTime: 0,
    results: []
  }
  
  // Reset racer progress
  racers.forEach(r => r.progress = 0)
  
  // Play timer sound
  timerAudio = new Audio(timerSound)
  
  // Wait for timer sound to finish before starting race
  timerAudio.addEventListener('ended', () => {
    beginRacing()
  })
  
  timerAudio.play().catch(e => console.log('Audio play failed:', e))
  
  // Visual countdown for user feedback (approximate)
  countdownTimer = setInterval(() => {
    if (raceState.value.countdown > 0) {
      raceState.value.countdown--
    }
  }, 1000)
}

const beginRacing = () => {
  // Clear countdown timer
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  raceState.value.phase = 'racing'
  
  // Stop timer sound (if still playing) and play music
  if (timerAudio) {
    timerAudio.pause()
    timerAudio = null
  }
  
  musicAudio = new Audio(musicSound)
  musicAudio.loop = true
  musicAudio.play().catch(e => console.log('Audio play failed:', e))
  
  // Race duration (8 seconds)
  const raceDuration = 8000
  const updateInterval = 50
  let elapsed = 0
  
  raceTimer = setInterval(() => {
    elapsed += updateInterval
    raceState.value.raceTime = elapsed
    
    // Update racer progress with random speed
    racers.forEach(racer => {
      const speed = Math.random() * 2 + 0.5
      racer.progress = Math.min(100, racer.progress + speed)
    })
    
    // Check if race is over
    if (elapsed >= raceDuration) {
      clearInterval(raceTimer)
      finishRace()
    }
  }, updateInterval)
}

const finishRace = () => {
  // Stop music
  if (musicAudio) {
    musicAudio.pause()
    musicAudio = null
  }
  
  // Calculate final results (sort by progress)
  const sortedRacers = [...racers].sort((a, b) => b.progress - a.progress)
  raceState.value.results = sortedRacers.map((racer, index) => ({
    ...racer,
    rank: index + 1,
    points: pointsByRank[index] || 0
  }))
  
  raceState.value.phase = 'result'
  
  // レース結果をFirebaseに送信
  submitRaceResult(raceState.value.results).catch(err => {
    console.error('Failed to submit race result to Firebase:', err)
  })
}

const closeRace = () => {
  // Clean up
  if (timerAudio) {
    timerAudio.pause()
    timerAudio = null
  }
  if (musicAudio) {
    musicAudio.pause()
    musicAudio = null
  }
  if (raceTimer) clearInterval(raceTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  
  raceState.value = {
    show: false,
    phase: 'countdown',
    countdown: 3,
    raceTime: 0,
    results: []
  }
  
  // ベット情報はバックエンドのJSONファイルで管理（レース結果送信時にクリアされる）
  console.log('Race closed')
}

const closeRegister = () => {
  registerState.value = {
    show: false,
    step: 'waiting',
    qrUrl: null,
    registrationId: null,
    expiresIn: null,
    error: null
  }
  // NFCモードをloginに戻す
  setNFCMode('login')
}

const selectBet = (bet) => {
  loginState.value.selectedBet = bet
  loginState.value.step = 'complete'
  console.log(`Selected bet: ${bet.name}`)
  
  // ベット情報をバックエンドに保存
  if (loginState.value.loginResult && loginState.value.loginResult.userName) {
    const betInfo = {
      userId: loginState.value.loginResult.userId || 'unknown',
      displayName: loginState.value.loginResult.userName,
      selectedBet: bet.name,
      timestamp: new Date().toISOString()
    }
    
    // バックエンドAPIに送信
    saveBetToBackend(betInfo).catch(err => {
      console.error('Failed to save bet:', err)
    })
    console.log('Bet sent to backend:', betInfo)
  }
  
  // 結果表示に遷移してから2秒後に閉じる
  setTimeout(() => {
    loginState.value.step = 'final_result'
    
    setTimeout(() => {
      closeLoginModal()
    }, 2000)
  }, 500)
}

const closeLoginModal = () => {
  loginState.value = { 
    show: false, 
    step: 'select', 
    selectedBet: null,
    nfcWaiting: false,
    loginResult: null
  }
  // NFCモードをloginに戻す
  setNFCMode('login')
}

const closeModal = () => modal.value.show = false

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  
  // WebSocket接続
  connectWebSocket()
  
  // ランキング取得開始
  startRankingPolling()
})

onUnmounted(() => {
  clearInterval(timer)
  
  // ランキングポーリング停止
  if (rankingInterval) {
    clearInterval(rankingInterval)
  }
  
  // WebSocket切断
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="relative w-screen h-screen flex flex-col text-white selection:bg-green-500 selection:text-black">
    
    <!-- Background Elements -->
    <div class="absolute inset-0 bg-pattern z-0"></div>
    <div class="absolute inset-0 scanlines z-50 pointer-events-none opacity-30"></div>
    <div class="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-green-900/10 to-transparent transform skew-x-12 z-0 pointer-events-none"></div>

    <!-- UPPER SECTION: Header / Top Bar -->
    <header class="relative z-10 w-full h-32 px-8 flex justify-between items-center border-b-4 border-green-600 bg-black/80 backdrop-blur-sm shrink-0">
      <div class="flex items-center gap-6">
        <!-- Logo (画像を使用する場合は、public/logo.pngに配置してsrc="/logo.png"に変更) -->
        <img src="./logo.png" 
             alt="部室王ロゴ" 
             class="h-24 object-contain transform -skew-x-6 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
        
        <!-- Title Text -->
        <!--<h1 class="text-4xl md:text-5xl font-black italic tracking-tighter text-white title-stroke transform -skew-x-6">
          <span class="text-green-500">🤩</span>部★室★王<span class="text-green-500">🤩</span>
        </h1>-->

        <!-- Current King Display -->
        <div class="hidden lg:flex items-center gap-6 ml-8">
          <div class="flex flex-col transform -skew-x-12">
            <div class="bg-gradient-to-r from-yellow-900/80 to-black border-2 border-yellow-500 px-8 py-2 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center gap-4">
              <span class="text-4xl animate-pulse">👑</span>
              <div>
                <span class="text-sm text-yellow-400 font-bold block leading-none mb-1 tracking-wider">現在の部室王</span>
                <span class="text-2xl font-black text-white leading-none italic tracking-wider shadow-black drop-shadow-md">
                  {{ rankingData.length > 0 && rankingData[0].rank === 1 ? rankingData[0].name : '---' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Attendance Count -->
          <div class="flex flex-col transform -skew-x-12">
            <div class="bg-gradient-to-r from-green-900/80 to-black border-2 border-green-500 px-8 py-2 shadow-[0_0_15px_rgba(0,255,0,0.4)] flex items-center gap-4">
              <span class="text-4xl">👥</span>
              <div>
                <span class="text-sm text-green-400 font-bold block leading-none mb-1 tracking-wider">今日来た人数</span>
                <span class="text-2xl font-black text-white leading-none italic tracking-wider shadow-black drop-shadow-md">
                  {{ attendanceCount }} <span class="text-lg text-gray-400">人</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Live Clock -->
      <div class="flex flex-col items-end transform -skew-x-6">
        <div class="text-5xl font-['Russo_One'] text-green-400 leading-none drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">{{ currentTime }}</div>
        <div class="text-lg font-bold text-gray-400 tracking-widest">{{ currentDate }}</div>
      </div>
    </header>

    <!-- MIDDLE SECTION: Art Panel & Ranking -->
    <main class="relative z-10 flex-1 flex gap-8 p-8 pb-4 min-h-0">
      
      <!-- LEFT: Art Panel -->
      <section class="flex-[3] relative flex flex-col min-h-0">
        <div class="w-full h-full border-4 border-white bg-gray-900 relative shadow-[0_0_20px_rgba(0,255,0,0.1)] overflow-hidden group">
          <!-- Corner Deco -->
          <div class="absolute top-0 left-0 w-12 h-12 bg-green-600 z-20 clip-path-triangle"></div>
          <div class="absolute bottom-0 right-0 w-12 h-12 bg-green-600 z-20 clip-path-triangle-br"></div>
          
          <!-- Content Area -->
          <div class="w-full h-full flex items-center justify-center relative">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#00ff00 1px, transparent 1px); background-size: 20px 20px;"></div>
            <div class="text-center z-10">
              <div class="text-5xl mb-4 text-white/50">🖼️</div>
              <h2 class="text-xl font-bold text-green-500 bg-black px-4 py-1 transform -skew-x-12 border border-green-500">
                ART PANEL AREA
              </h2>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: Ranking -->
      <section class="flex-[1] min-w-[380px] flex flex-col">
        <!-- Header -->
        <div class="bg-black border-2 border-green-500 px-6 py-2 mb-3 transform -skew-x-12 w-full shadow-[4px_4px_0px_rgba(0,255,0,0.3)]">
          <h3 class="text-2xl font-black italic text-white text-center transform skew-x-12 tracking-wider">
            🏆 RANKING
          </h3>
        </div>
        
        <!-- List -->
        <div class="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
          <!-- Loading State -->
          <div v-if="rankingLoading && rankingData.length === 0" class="text-center text-green-500 py-6">
            <div class="animate-pulse text-lg">ランキング読み込み中...</div>
          </div>
          
          <!-- Error State -->
          <div v-else-if="rankingError && rankingData.length === 0" class="text-center text-red-500 py-6">
            <div class="text-lg">エラー: {{ rankingError }}</div>
            <button @click="fetchRanking()" class="mt-2 text-base text-green-400 underline">再読み込み</button>
          </div>
          
          <!-- Ranking List -->
          <div v-else v-for="(user, index) in rankingData" :key="user.rank || index" 
               class="relative group h-16 transform -skew-x-12 transition-all duration-200 hover:scale-[1.02] hover:translate-x-1">
            
            <!-- Background -->
            <div :class="[
              'absolute inset-0 border-2',
              user.rank === 1 ? 'bg-yellow-900/40 border-yellow-500' : 
              user.rank === 2 ? 'bg-gray-700/40 border-gray-400' : 
              user.rank === 3 ? 'bg-orange-900/40 border-orange-500' : 
              'bg-gray-900/40 border-green-900'
            ]"></div>
            
            <!-- Content -->
            <div class="absolute inset-0 flex items-center justify-between px-5 transform skew-x-12">
              <div class="flex items-center gap-4">
                <div :class="[
                  'font-black text-2xl italic w-10 text-center',
                  user.rank === 1 ? 'text-yellow-400 text-3xl' : 
                  user.rank === 2 ? 'text-gray-300' : 
                  user.rank === 3 ? 'text-orange-400' : 'text-green-700'
                ]">{{ user.rank }}</div>
                <div class="font-bold text-lg truncate max-w-[150px] flex items-center gap-2">
                  {{ user.name }}
                  <span v-if="user.isPresident" class="text-yellow-400 text-sm">👑</span>
                </div>
              </div>
              <div class="font-mono font-bold text-green-400 text-base">
                {{ user.points.toLocaleString() }} <span class="text-xs text-gray-500">PTS</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- EVENT SCHEDULE (ランキングの下) -->
        <div class="mt-4 flex flex-col transform -skew-x-6">
          <!-- Event Header -->
          <div class="bg-gradient-to-r from-purple-900 to-black border border-purple-500 px-3 py-2 mb-2">
            <h3 class="text-sm font-black text-purple-300 tracking-widest text-center transform skew-x-6">EVENT SCHEDULE</h3>
          </div>
          
          <!-- Event List -->
          <div class="bg-black/50 border border-gray-700 p-3 space-y-2">
            <div v-for="(event, i) in eventData" :key="i" class="flex items-center justify-between text-sm border-b border-gray-800 pb-2 last:border-0 transform skew-x-6">
              <div>
                <span class="text-green-400 font-bold mr-2">{{ event.date }}</span>
                <span class="text-gray-200">{{ event.title }}</span>
              </div>
              <span class="bg-red-600 text-white px-2 py-0.5 font-bold text-xs rounded">{{ event.bonus }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- LOWER SECTION: Buttons & Events -->
    <section class="relative z-10 h-48 shrink-0 flex gap-6 px-8 pb-8">
      
      <!-- BUTTONS GROUP (Left, Grows) -->
      <div class="flex-[3] flex gap-4 h-full">
        
        <!-- 1. LOGIN -->
        <button @click="triggerAction('Login')" class="flex-[1.2] group relative focus:outline-none">
          <div class="absolute inset-0 bg-green-600 border-4 border-white transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-green-500 group-hover:shadow-[8px_8px_0px_rgba(0,0,0,0.8)] group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12 group-hover:scale-105 transition-transform">
            <span class="text-5xl mb-2 drop-shadow-md">⚡</span>
            <span class="text-3xl font-black italic tracking-tighter text-black">LOGIN</span>
            <span class="text-sm bg-black text-white px-3 py-1 font-bold">入室</span>
          </div>
        </button>

        <!-- 2. TODAY'S RACE -->
        <button @click="triggerAction('Race')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-black border-2 border-green-500 transform -skew-x-12 shadow-[4px_4px_0px_rgba(0,255,0,0.2)] group-hover:bg-green-900 group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-4xl mb-2 group-hover:rotate-12 transition-transform">🏁</span>
            <span class="text-2xl font-black italic text-white">RACE</span>
            <span class="text-sm text-green-400 font-bold">今日のレース</span>
          </div>
        </button>

        <!-- 3. REGISTER -->
        <button @click="triggerAction('Register')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-gray-800 border-2 border-gray-500 transform -skew-x-12 group-hover:bg-white group-hover:border-white group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-3xl mb-2 group-hover:text-black transition-colors">📝</span>
            <span class="text-xl font-bold group-hover:text-black transition-colors">登録</span>
          </div>
        </button>

        <!-- 4. SETTINGS -->
        <button @click="triggerAction('Settings')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-gray-800 border-2 border-gray-500 transform -skew-x-12 group-hover:bg-gray-700 group-hover:border-green-400 group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-3xl mb-2 animate-spin-slow">⚙️</span>
            <span class="text-xl font-bold">設定</span>
          </div>
        </button>
      </div>

    </section>

    <!-- Footer Status -->
    <footer class="relative z-10 bg-black border-t border-gray-800 p-2 px-6 flex justify-between items-center text-sm text-gray-600 font-mono shrink-0">
      <div>SYS_STATUS: <span class="text-green-600 animate-pulse">● NORMAL</span></div>
      <div>CLUB-ROOM-KING-SYS v1.2</div>
    </footer>
    
    <!-- Modal -->
    <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" @click="closeModal">
      <div class="bg-green-600 p-1 transform skew-x-[-10deg] animate-[ping_0.1s_ease-out]">
        <div class="bg-black border-4 border-white p-12 transform min-w-[300px] text-center relative shadow-[0_0_50px_rgba(0,255,0,0.5)]">
          <h3 class="text-3xl font-black text-white italic mb-2 transform skew-x-[10deg]">{{ modal.title }}</h3>
          <p class="text-green-400 font-bold transform skew-x-[10deg]">SELECTED!</p>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="loginState.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      
      <!-- NFC Waiting -->
      <div v-if="loginState.step === 'waiting'" class="text-center">
        <div class="mb-12">
          <div class="relative inline-block">
            <!-- Glow effect -->
            <div class="absolute inset-0 blur-3xl bg-green-500/30 rounded-full scale-150"></div>
            
            <!-- Icon -->
            <div class="relative text-9xl mb-8 animate-pulse">
              📱
            </div>
          </div>
          
          <!-- Text -->
          <div class="bg-green-600 px-12 py-6 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(0,255,0,0.5)] mb-4">
            <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
              NFC カードをかざしてください
            </h2>
          </div>
          
          <div class="mt-6 text-gray-400 text-lg">
            カードリーダーに近づけてお待ちください
          </div>
          
          <!-- Animated rings (NFC signal effect) -->
          <div class="relative h-32 mt-8">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div class="w-20 h-20 border-4 border-green-500 rounded-full animate-ping"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-150">
              <div class="w-20 h-20 border-4 border-green-400 rounded-full animate-ping"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-300">
              <div class="w-20 h-20 border-4 border-green-300 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <!-- WebSocket status -->
          <div class="mt-4 text-xs">
            <span :class="wsConnected ? 'text-green-500' : 'text-red-500'">
              {{ wsConnected ? '● 接続中' : '● 切断' }}
            </span>
          </div>
        </div>
        
        <!-- Back button -->
        <button 
          @click="closeLoginModal"
          class="group relative focus:outline-none mt-8"
        >
          <div class="bg-gray-700 border-4 border-gray-500 px-12 py-4 transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-gray-600 group-hover:-translate-y-1 transition-all">
            <span class="text-2xl font-black italic text-white transform skew-x-12 inline-block tracking-wider">
              ← キャンセル
            </span>
          </div>
        </button>
      </div>
      
      <!-- Login Result -->
      <div v-if="loginState.step === 'result'" class="text-center">
        <div class="relative">
          <!-- Glow effect -->
          <div :class="[
            'absolute inset-0 blur-3xl rounded-full scale-150',
            loginState.loginResult?.success ? 'bg-green-500/30' : 'bg-red-500/30'
          ]"></div>
          
          <!-- Content -->
          <div class="relative">
            <!-- Success -->
            <div v-if="loginState.loginResult?.success">
              <div class="text-9xl mb-6 animate-bounce">
                ⭐
              </div>
              
              <div class="bg-green-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(0,255,0,0.5)]">
                <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
                  {{ loginState.loginResult.message }}
                </h2>
              </div>
              
              <div class="mt-6 space-y-2">
                <div class="text-2xl font-bold text-white">
                  {{ loginState.loginResult.userName }} さん
                </div>
                <div class="text-3xl font-black text-green-400 font-['Russo_One']">
                  +{{ loginState.loginResult.points }} pts
                </div>
                <div class="text-gray-400">
                  総ポイント: {{ loginState.loginResult.totalPoints }} pts
                </div>
              </div>
            </div>
            
            <!-- Error -->
            <div v-else>
              <div class="text-9xl mb-6">
                ❌
              </div>
              
              <div class="bg-red-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
                  エラー
                </h2>
              </div>
              
              <div class="mt-6 text-xl text-red-400">
                {{ loginState.loginResult?.error }}
              </div>
              
              <div v-if="loginState.loginResult?.code === 'BAD_REQUEST'" class="mt-4 text-gray-400 text-sm">
                カードを登録してください
              </div>
            </div>
            
            <div class="mt-6 text-gray-500 text-sm">
              画面が自動的に閉じます...
            </div>
          </div>
        </div>
      </div>
      
      <!-- Step 1: Bet Selection (保留) -->
      <div v-if="loginState.step === 'select'" class="text-center">
        <!-- Header -->
        <div class="mb-8">
          <div class="bg-green-600 px-8 py-2 transform -skew-x-12 inline-block mb-4">
            <h2 class="text-3xl font-black text-white italic transform skew-x-12 tracking-wider">
              ⚡ ベットを選択 ⚡
            </h2>
          </div>
          <p class="text-gray-400 text-sm">今日の運勢を選んでください</p>
        </div>
        
        <!-- Bet Options -->
        <div class="flex gap-6 justify-center">
          <button 
            v-for="bet in betOptions" 
            :key="bet.id"
            @click="selectBet(bet)"
            class="group relative focus:outline-none transform transition-all duration-300 hover:scale-110 hover:-translate-y-2"
          >
            <!-- Card -->
            <div :class="[
              'w-40 h-52 border-4 transform -skew-x-6 relative overflow-hidden',
              bet.border,
              'bg-gradient-to-br',
              bet.color,
              'shadow-[0_0_30px_rgba(0,0,0,0.5)]',
              'group-hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]'
            ]">
              <!-- Shine effect -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <!-- Content -->
              <div class="absolute inset-0 flex flex-col items-center justify-center transform skew-x-6">
                <span class="text-7xl mb-4 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">{{ bet.icon }}</span>
                <span class="text-xl font-black text-white italic tracking-wider drop-shadow-md">{{ bet.name }}</span>
              </div>
              
              <!-- Corner decorations -->
              <div class="absolute top-0 left-0 w-6 h-6 bg-white/20"></div>
              <div class="absolute bottom-0 right-0 w-6 h-6 bg-black/20"></div>
            </div>
          </button>
        </div>
        
        <!-- Cancel button -->
        <button 
          @click="closeLoginModal" 
          class="mt-8 text-gray-500 hover:text-white transition-colors text-sm"
        >
          ✕ キャンセル
        </button>
      </div>
      
      <!-- Bet Selection Complete (選択直後のアニメーション) -->
      <div v-if="loginState.step === 'complete'" class="text-center">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute inset-0 blur-3xl bg-green-500/30 rounded-full scale-150"></div>
          
          <!-- Content -->
          <div class="relative">
            <!-- Selected icon -->
            <div class="text-9xl mb-6 animate-bounce">
              {{ loginState.selectedBet?.icon }}
            </div>
            
            <!-- Selection message -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(147,51,234,0.5)]">
              <h2 class="text-3xl font-black text-white italic transform skew-x-12 tracking-wider">
                {{ loginState.selectedBet?.name }} を選択！
              </h2>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Final Result (ログイン完了) -->
      <div v-if="loginState.step === 'final_result'" class="text-center">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute inset-0 blur-3xl bg-green-500/30 rounded-full scale-150"></div>
          
          <!-- Content -->
          <div class="relative">
            <!-- Success icon with selected bet -->
            <div class="flex items-center justify-center gap-4 mb-6">
              <div class="text-9xl animate-pulse">
                ⭐
              </div>
              <div class="text-7xl animate-bounce">
                {{ loginState.selectedBet?.icon }}
              </div>
            </div>
            
            <!-- Success message -->
            <div class="bg-green-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(0,255,0,0.5)] mb-4">
              <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
                ログイン完了！
              </h2>
            </div>
            
            <div class="mt-6 space-y-2">
              <div class="text-2xl font-bold text-white">
                {{ loginState.loginResult?.userName }} さん
              </div>
              <div class="text-xl text-purple-400 font-bold">
                {{ loginState.selectedBet?.name }} で勝負！
              </div>
              <div class="text-3xl font-black text-green-400 font-['Russo_One']">
                +{{ loginState.loginResult?.points }} pts
              </div>
              <div class="text-gray-400">
                総ポイント: {{ loginState.loginResult?.totalPoints }} pts
              </div>
            </div>
            
            <div class="mt-6 text-gray-500 text-sm">
              ホーム画面に戻ります...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Race Screen -->
    <div v-if="raceState.show" class="fixed inset-0 z-50 bg-black flex flex-col">
      
      <!-- Race Header -->
      <header class="h-20 bg-gradient-to-r from-purple-900 via-black to-purple-900 border-b-4 border-purple-500 flex items-center justify-center relative">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%221%22 fill=%22%23ffffff10%22/%3E%3C/svg%3E')]"></div>
        <h1 class="text-4xl font-black italic text-white tracking-wider transform -skew-x-6 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
          🏁 TODAY'S RACE 🏁
        </h1>
      </header>
      
      <!-- Race Content -->
      <div class="flex-1 flex items-center justify-center p-8">
        
        <!-- Countdown Phase -->
        <div v-if="raceState.phase === 'countdown'" class="text-center">
          <div class="text-[200px] font-black text-white animate-pulse drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
            {{ raceState.countdown }}
          </div>
          <div class="text-2xl text-purple-400 font-bold tracking-widest animate-pulse">
            GET READY...
          </div>
        </div>
        
        <!-- Racing Phase -->
        <div v-if="raceState.phase === 'racing'" class="w-full max-w-4xl">
          <div class="mb-8 text-center">
            <span class="text-6xl font-black text-green-400 font-['Russo_One'] animate-pulse">
              GO!!!
            </span>
          </div>
          
          <!-- Race Tracks -->
          <div class="space-y-6">
            <div v-for="racer in racers" :key="racer.id" class="relative">
              <!-- Track Background -->
              <div class="h-20 bg-gray-900 border-2 border-gray-700 rounded-lg relative overflow-hidden">
                <!-- Track lines -->
                <div class="absolute inset-0 opacity-20" style="background-image: repeating-linear-gradient(90deg, transparent, transparent 50px, #fff 50px, #fff 52px);"></div>
                
                <!-- Progress bar -->
                <div 
                  :class="['absolute left-0 top-0 h-full bg-gradient-to-r transition-all duration-100', racer.color]"
                  :style="{ width: racer.progress + '%' }"
                ></div>
                
                <!-- Racer -->
                <div 
                  class="absolute top-1/2 -translate-y-1/2 text-5xl transition-all duration-100 drop-shadow-lg"
                  :style="{ left: `calc(${racer.progress}% - 30px)` }"
                >
                  {{ racer.icon }}
                </div>
                
                <!-- Racer name -->
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg z-10 drop-shadow-md">
                  {{ racer.name }}
                </div>
                
                <!-- Finish line -->
                <div class="absolute right-0 top-0 h-full w-4 bg-gradient-to-b from-white via-black to-white"></div>
              </div>
            </div>
          </div>
          
          <!-- Race Time -->
          <div class="mt-8 text-center">
            <span class="text-gray-400 font-mono">TIME: </span>
            <span class="text-2xl text-green-400 font-['Russo_One']">
              {{ (raceState.raceTime / 1000).toFixed(2) }}s
            </span>
          </div>
        </div>
        
        <!-- Result Phase -->
        <div v-if="raceState.phase === 'result'" class="text-center w-full max-w-2xl">
          <div class="mb-8">
            <div class="bg-gradient-to-r from-yellow-600 to-yellow-400 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(234,179,8,0.5)]">
              <h2 class="text-4xl font-black text-black italic transform skew-x-12 tracking-wider">
                🏆 RACE RESULT 🏆
              </h2>
            </div>
          </div>
          
          <!-- Results -->
          <div class="space-y-4 mb-8">
            <div 
              v-for="result in raceState.results" 
              :key="result.id"
              :class="[
                'flex items-center justify-between p-4 border-4 transform -skew-x-6',
                result.rank === 1 ? 'bg-yellow-900/50 border-yellow-500 scale-110' : 
                result.rank === 2 ? 'bg-gray-700/50 border-gray-400' : 
                'bg-orange-900/30 border-orange-600'
              ]"
            >
              <div class="flex items-center gap-4 transform skew-x-6">
                <span :class="[
                  'text-4xl font-black italic',
                  result.rank === 1 ? 'text-yellow-400' : 
                  result.rank === 2 ? 'text-gray-300' : 'text-orange-400'
                ]">
                  {{ result.rank === 1 ? '👑' : result.rank }}
                </span>
                <span class="text-5xl">{{ result.icon }}</span>
                <span class="text-2xl font-bold text-white">{{ result.name }}</span>
              </div>
              <div class="transform skew-x-6 text-right">
                <div class="text-3xl font-black text-green-400 font-['Russo_One']">
                  +{{ result.points.toLocaleString() }}
                </div>
                <div class="text-sm text-gray-400">POINTS</div>
              </div>
            </div>
          </div>
          
          <!-- Back Button -->
          <button 
            @click="closeRace"
            class="group relative focus:outline-none mt-4"
          >
            <div class="bg-green-600 border-4 border-white px-12 py-4 transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-green-500 group-hover:-translate-y-1 transition-all">
              <span class="text-2xl font-black italic text-white transform skew-x-12 inline-block tracking-wider">
                ← ホームに戻る
              </span>
            </div>
          </button>
        </div>
        
      </div>
    </div>

    <!-- Register Screen -->
    <div v-if="registerState.show" class="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
      
      <!-- Waiting for NFC -->
      <div v-if="registerState.step === 'waiting'" class="text-center">
        <div class="mb-12">
          <div class="relative inline-block">
            <!-- Glow effect -->
            <div class="absolute inset-0 blur-3xl bg-blue-500/30 rounded-full scale-150"></div>
            
            <!-- Icon -->
            <div class="relative text-9xl mb-8 animate-pulse">
              📱
            </div>
          </div>
          
          <!-- Text -->
          <div class="bg-blue-600 px-12 py-6 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-4">
            <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
              NFC カードをかざしてください
            </h2>
          </div>
          
          <div class="mt-6 text-gray-400 text-lg">
            カードリーダーに近づけてお待ちください
          </div>
          
          <!-- Animated rings (NFC signal effect) -->
          <div class="relative h-32 mt-8">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div class="w-20 h-20 border-4 border-blue-500 rounded-full animate-ping"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-150">
              <div class="w-20 h-20 border-4 border-blue-400 rounded-full animate-ping"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-300">
              <div class="w-20 h-20 border-4 border-blue-300 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <!-- WebSocket status -->
          <div class="mt-4 text-xs">
            <span :class="wsConnected ? 'text-blue-500' : 'text-red-500'">
              {{ wsConnected ? '● 接続中' : '● 切断' }}
            </span>
          </div>
        </div>
        
        <!-- Back button -->
        <button 
          @click="closeRegister"
          class="group relative focus:outline-none mt-8"
        >
          <div class="bg-gray-700 border-4 border-gray-500 px-12 py-4 transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-gray-600 group-hover:-translate-y-1 transition-all">
            <span class="text-2xl font-black italic text-white transform skew-x-12 inline-block tracking-wider">
              ← 戻る
            </span>
          </div>
        </button>
      </div>
      
      <!-- QR Code Display -->
      <div v-if="registerState.step === 'qr'" class="text-center max-w-2xl">
        <div class="mb-8">
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(59,130,246,0.5)]">
            <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
              📱 QRコードをスキャン 📱
            </h2>
          </div>
        </div>
        
        <!-- QR Code -->
        <div class="bg-white p-8 rounded-lg inline-block mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
          <img 
            :src="'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(registerState.qrUrl)" 
            alt="QR Code"
            class="w-80 h-80"
          >
        </div>
        
        <!-- Instructions -->
        <div class="space-y-4 mb-8">
          <div class="text-xl text-white font-bold">
            スマートフォンでQRコードをスキャンして
          </div>
          <div class="text-lg text-gray-400">
            アカウントと連携してください
          </div>
          
          <!-- Link URL (fallback) -->
          <div class="mt-4 p-4 bg-gray-900 border border-gray-700 rounded">
            <div class="text-xs text-gray-500 mb-2">または、このURLにアクセス:</div>
            <a :href="registerState.qrUrl" target="_blank" class="text-sm text-blue-400 hover:text-blue-300 break-all">
              {{ registerState.qrUrl }}
            </a>
          </div>
          
          <!-- Expiration info -->
          <div class="text-sm text-yellow-400">
            ⏰ {{ Math.floor(registerState.expiresIn / 60) }}分以内に連携を完了してください
          </div>
        </div>
        
        <!-- Back button -->
        <button 
          @click="closeRegister"
          class="group relative focus:outline-none"
        >
          <div class="bg-gray-700 border-4 border-gray-500 px-12 py-4 transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-gray-600 group-hover:-translate-y-1 transition-all">
            <span class="text-2xl font-black italic text-white transform skew-x-12 inline-block tracking-wider">
              ← 戻る
            </span>
          </div>
        </button>
      </div>
      
      <!-- Error -->
      <div v-if="registerState.step === 'error'" class="text-center">
        <div class="text-9xl mb-6">❌</div>
        
        <div class="bg-red-600 px-12 py-4 transform -skew-x-12 inline-block shadow-[0_0_50px_rgba(239,68,68,0.5)] mb-4">
          <h2 class="text-4xl font-black text-white italic transform skew-x-12 tracking-wider">
            エラー
          </h2>
        </div>
        
        <div class="mt-6 text-xl text-red-400">
          {{ registerState.error }}
        </div>
        
        <div class="mt-6 text-gray-500 text-sm">
          画面が自動的に閉じます...
        </div>
      </div>
      
    </div>

  </div>
</template>

<style>
body {
  font-family: 'Noto Sans JP', sans-serif;
  overflow: hidden;
  background-color: #050505;
}

/* Diagonal background pattern */
.bg-pattern {
  background-image: linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111),
  linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.5;
}

/* The "Smash" Slant */
.smash-skew {
  transform: skewX(-12deg);
}

.smash-unskew {
  transform: skewX(12deg);
}

/* Button Hover Animations */
.smash-btn {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.smash-btn:active {
  transform: skewX(-12deg) scale(0.95);
}

.smash-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: 0.5s;
}

.smash-btn:hover::before {
  left: 100%;
}

/* CRT Scanline effect */
.scanlines {
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,0,0,0.1) 50%,
    rgba(0,0,0,0.1)
  );
  background-size: 100% 4px;
  pointer-events: none;
}

/* Text Stroke for Title */
.title-stroke {
  -webkit-text-stroke: 2px #000;
  text-shadow: 4px 4px 0px rgba(0, 255, 0, 0.5);
}

/* Scrollbar hiding for clean UI */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Custom Animations */
@keyframes spin-slow { 
  from { transform: rotate(0deg); } 
  to { transform: rotate(360deg); } 
}
.animate-spin-slow { 
  animation: spin-slow 10s linear infinite; 
}

/* Animation delays for NFC rings */
.animation-delay-150 {
  animation-delay: 0.15s;
}
.animation-delay-300 {
  animation-delay: 0.3s;
}

/* Clip paths for corner decorations */
.clip-path-triangle { 
  clip-path: polygon(0 0, 100% 0, 0 100%); 
}
.clip-path-triangle-br { 
  clip-path: polygon(100% 100%, 100% 0, 0 100%); 
}
</style>
