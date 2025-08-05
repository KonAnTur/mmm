<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">YouTube Аналитика</h1>
      <button
        @click="showAddDialog = true"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Добавить канал
      </button>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div class="px-4 py-5 sm:px-6">
        <h2 class="text-lg leading-6 font-medium text-gray-900">Отслеживаемые каналы</h2>
      </div>
      <TrackedChannelsTable :channels="channels" />
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h2 class="text-lg leading-6 font-medium text-gray-900">Последние видео</h2>
      </div>
      <YouTubeVideosTable :videos="videos" />
    </div>

    <AddChannelDialog
      v-if="showAddDialog"
      @close="showAddDialog = false"
      @add="addChannel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showAddDialog = ref(false)
const channels = ref([])
const videos = ref([])

async function fetchData() {
  try {
    const [channelsResponse, videosResponse] = await Promise.all([
      fetch('/api/youtube/channels'),
      fetch('/api/youtube/videos')
    ])
    
    channels.value = await channelsResponse.json()
    videos.value = await videosResponse.json()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

async function addChannel(url: string) {
  try {
    await fetch('/api/youtube/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    })
    await fetchData()
  } catch (error) {
    console.error('Error adding channel:', error)
  }
}

onMounted(fetchData)
</script> 