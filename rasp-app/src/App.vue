<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const currentDate = ref('')
const modal = ref({ show: false, title: '' })
let timer

// Mock Data
const rankingData = ref([
  { name: '山田 太郎', points: 15200 },
  { name: '鈴木 花子', points: 12400 },
  { name: '佐藤 健', points: 9800 },
  { name: '高橋 優', points: 8500 },
  { name: '田中 誠', points: 7200 },
  { name: '伊藤 修', points: 6500 },
])

const eventData = ref([
  { date: '12/24', title: 'Xmas Party', bonus: 'x2.0' },
  { date: '12/31', title: '年越し部室', bonus: 'x3.0' },
  { date: '01/01', title: '初日の出', bonus: 'x5.0' },
  { date: '01/10', title: '新歓準備', bonus: 'x1.5' },
])

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  currentDate.value = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`
}

const triggerAction = (actionName) => {
  console.log(`Action: ${actionName}`)
  modal.value = { show: true, title: actionName.toUpperCase() }
  setTimeout(() => { if(modal.value.show) closeModal() }, 1500)
}

const closeModal = () => modal.value.show = false

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="relative w-screen h-screen flex flex-col text-white selection:bg-green-500 selection:text-black">
    
    <!-- Background Elements -->
    <div class="absolute inset-0 bg-pattern z-0"></div>
    <div class="absolute inset-0 scanlines z-50 pointer-events-none opacity-30"></div>
    <div class="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-green-900/10 to-transparent transform skew-x-12 z-0 pointer-events-none"></div>

    <!-- UPPER SECTION: Header / Top Bar -->
    <header class="relative z-10 w-full h-24 px-6 flex justify-between items-center border-b-4 border-green-600 bg-black/80 backdrop-blur-sm shrink-0">
      <div class="flex items-center gap-4">
        <!-- Logo (画像を使用する場合は、public/logo.pngに配置してsrc="/logo.png"に変更) -->
        <img src="./logo.png" 
             alt="部室王ロゴ" 
             class="h-16 md:h-20 object-contain transform -skew-x-6 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
        
        <!-- Title Text -->
        <!--<h1 class="text-4xl md:text-5xl font-black italic tracking-tighter text-white title-stroke transform -skew-x-6">
          <span class="text-green-500">🤩</span>部★室★王<span class="text-green-500">🤩</span>
        </h1>-->

        <!-- Current King Display -->
        <div class="hidden lg:flex flex-col transform -skew-x-12 ml-6">
          <div class="bg-gradient-to-r from-yellow-900/80 to-black border-2 border-yellow-500 px-6 py-1 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center gap-3">
            <span class="text-2xl animate-pulse">👑</span>
            <div>
              <span class="text-[10px] text-yellow-400 font-bold block leading-none mb-1 tracking-wider">現在の部室王</span>
              <span class="text-xl font-black text-white leading-none italic tracking-wider shadow-black drop-shadow-md">山田 太郎</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Live Clock -->
      <div class="flex flex-col items-end transform -skew-x-6">
        <div class="text-4xl font-['Russo_One'] text-green-400 leading-none drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">{{ currentTime }}</div>
        <div class="text-sm font-bold text-gray-400 tracking-widest">{{ currentDate }}</div>
      </div>
    </header>

    <!-- MIDDLE SECTION: Art Panel & Ranking -->
    <main class="relative z-10 flex-1 flex gap-6 p-6 pb-2 min-h-0">
      
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
      <section class="flex-[1] min-w-[300px] flex flex-col">
        <!-- Header -->
        <div class="bg-black border-2 border-green-500 px-4 py-1 mb-2 transform -skew-x-12 w-full shadow-[4px_4px_0px_rgba(0,255,0,0.3)]">
          <h3 class="text-xl font-black italic text-white text-center transform skew-x-12 tracking-wider">
            🏆 RANKING
          </h3>
        </div>
        
        <!-- List -->
        <div class="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-2">
          <div v-for="(user, index) in rankingData" :key="index" 
               class="relative group h-14 transform -skew-x-12 transition-all duration-200 hover:scale-[1.02] hover:translate-x-1">
            
            <!-- Background -->
            <div :class="[
              'absolute inset-0 border-2',
              index === 0 ? 'bg-yellow-900/40 border-yellow-500' : 
              index === 1 ? 'bg-gray-700/40 border-gray-400' : 
              index === 2 ? 'bg-orange-900/40 border-orange-500' : 
              'bg-gray-900/40 border-green-900'
            ]"></div>
            
            <!-- Content -->
            <div class="absolute inset-0 flex items-center justify-between px-4 transform skew-x-12">
              <div class="flex items-center gap-3">
                <div :class="[
                  'font-black text-xl italic w-8 text-center',
                  index === 0 ? 'text-yellow-400 text-2xl' : 
                  index === 1 ? 'text-gray-300' : 
                  index === 2 ? 'text-orange-400' : 'text-green-700'
                ]">{{ index + 1 }}</div>
                <div class="font-bold text-sm md:text-base truncate max-w-[120px]">{{ user.name }}</div>
              </div>
              <div class="font-mono font-bold text-green-400 text-sm">
                {{ user.points.toLocaleString() }} <span class="text-[10px] text-gray-500">PTS</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- LOWER SECTION: Buttons & Events -->
    <section class="relative z-10 h-40 shrink-0 flex gap-4 px-6 pb-8">
      
      <!-- BUTTONS GROUP (Left, Grows) -->
      <div class="flex-[3] flex gap-3 h-full">
        
        <!-- 1. LOGIN -->
        <button @click="triggerAction('Login')" class="flex-[1.2] group relative focus:outline-none">
          <div class="absolute inset-0 bg-green-600 border-4 border-white transform -skew-x-12 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] group-hover:bg-green-500 group-hover:shadow-[8px_8px_0px_rgba(0,0,0,0.8)] group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12 group-hover:scale-105 transition-transform">
            <span class="text-4xl mb-1 drop-shadow-md">⚡</span>
            <span class="text-2xl font-black italic tracking-tighter text-black">LOGIN</span>
            <span class="text-[10px] bg-black text-white px-2 py-0.5 font-bold">入室</span>
          </div>
        </button>

        <!-- 2. TODAY'S RACE -->
        <button @click="triggerAction('Race')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-black border-2 border-green-500 transform -skew-x-12 shadow-[4px_4px_0px_rgba(0,255,0,0.2)] group-hover:bg-green-900 group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-3xl mb-1 group-hover:rotate-12 transition-transform">🏁</span>
            <span class="text-xl font-black italic text-white">RACE</span>
            <span class="text-[10px] text-green-400 font-bold">今日のレース</span>
          </div>
        </button>

        <!-- 3. REGISTER -->
        <button @click="triggerAction('Register')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-gray-800 border-2 border-gray-500 transform -skew-x-12 group-hover:bg-white group-hover:border-white group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-2xl mb-1 group-hover:text-black transition-colors">📝</span>
            <span class="text-lg font-bold group-hover:text-black transition-colors">登録</span>
          </div>
        </button>

        <!-- 4. SETTINGS -->
        <button @click="triggerAction('Settings')" class="flex-1 group relative focus:outline-none">
          <div class="absolute inset-0 bg-gray-800 border-2 border-gray-500 transform -skew-x-12 group-hover:bg-gray-700 group-hover:border-green-400 group-hover:-translate-y-1 transition-all"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center transform -skew-x-12">
            <span class="text-2xl mb-1 animate-spin-slow">⚙️</span>
            <span class="text-lg font-bold">設定</span>
          </div>
        </button>
      </div>

      <!-- EVENTS (Right End, Fixed Width) -->
      <div class="w-64 shrink-0 flex flex-col h-full transform -skew-x-6 ml-2">
        <!-- Event Header -->
        <div class="bg-gradient-to-r from-purple-900 to-black border border-purple-500 px-2 py-1 mb-1">
          <h3 class="text-xs font-black text-purple-300 tracking-widest text-center">EVENT SCHEDULE</h3>
        </div>
        
        <!-- Event List -->
        <div class="flex-1 bg-black/50 border border-gray-700 p-2 overflow-y-auto no-scrollbar space-y-2">
          <div v-for="(event, i) in eventData" :key="i" class="flex items-center justify-between text-xs border-b border-gray-800 pb-1 last:border-0">
            <div>
              <span class="text-green-400 font-bold mr-2">{{ event.date }}</span>
              <span class="text-gray-200">{{ event.title }}</span>
            </div>
            <span class="bg-red-600 text-white px-1 font-bold text-[10px] rounded">{{ event.bonus }}</span>
          </div>
        </div>
      </div>

    </section>

    <!-- Footer Status -->
    <footer class="relative z-10 bg-black border-t border-gray-800 p-1 px-4 flex justify-between items-center text-[10px] text-gray-600 font-mono shrink-0">
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

/* Clip paths for corner decorations */
.clip-path-triangle { 
  clip-path: polygon(0 0, 100% 0, 0 100%); 
}
.clip-path-triangle-br { 
  clip-path: polygon(100% 100%, 100% 0, 0 100%); 
}
</style>
