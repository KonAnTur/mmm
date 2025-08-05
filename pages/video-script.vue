<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Заголовок -->
        <v-card class="mb-6">
          <v-card-title class="text-h4 text-center py-6">
            <v-icon size="large" class="mr-3">mdi-video-outline</v-icon>
            Генератор скриптов видео
          </v-card-title>
          <v-card-subtitle class="text-center text-body-1">
            Загрузите видео с Instagram или YouTube и получите подробный скрипт с диалогами и действиями
          </v-card-subtitle>
          <div class="d-flex justify-center mt-4" style="gap: 16px;">
            <v-chip color="pink" variant="outlined" prepend-icon="mdi-instagram">
              Instagram
            </v-chip>
            <v-chip color="red" variant="outlined" prepend-icon="mdi-youtube">
              YouTube
            </v-chip>
          </div>
        </v-card>

        <!-- Форма загрузки -->
        <v-card class="mb-6">
          <v-card-title class="text-h5">
            <v-icon class="mr-2">mdi-link</v-icon>
            URL видео
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="generateScript">
              <v-text-field
                v-model="videoUrl"
                label="Вставьте ссылку на видео Instagram или YouTube"
                placeholder="Instagram: https://www.instagram.com/reel/ABC123/ или YouTube: https://www.youtube.com/shorts/ABC123"
                :rules="[rules.required, rules.videoUrl]"
                variant="outlined"
                class="mb-4"
                :disabled="loading"
                clearable
              />
              
              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="loading"
                :disabled="!videoUrl || loading"
                block
                class="mb-2"
              >
                <v-icon class="mr-2">mdi-play-circle</v-icon>
                {{ loading ? 'Обрабатываю видео...' : 'Сгенерировать скрипт' }}
              </v-btn>
              
              <v-alert
                v-if="loading"
                type="info"
                variant="tonal"
                class="mt-4"
              >
                <div class="d-flex align-center">
                  <v-progress-circular indeterminate size="20" class="mr-3" />
                  <div>
                    <strong>Обработка видео...</strong><br>
                    <small>Это может занять 10-30 секунд. Пожалуйста, подождите.</small>
                  </div>
                </div>
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Результат -->
        <v-card v-if="result" class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-document-outline</v-icon>
              Сгенерированный скрипт
            </div>
            <div>
              <v-btn
                color="success"
                variant="outlined"
                @click="openReprocessDialog"
                class="mr-2"
                prepend-icon="mdi-refresh"
              >
                Переработать сценарий
              </v-btn>
              <v-btn icon @click="clearResult">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card-title>
          
          <v-card-text>
            <!-- Информация о видео -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">
                <v-icon v-if="result.platform === 'instagram'" color="pink" class="mr-2">mdi-instagram</v-icon>
                <v-icon v-else-if="result.platform === 'youtube'" color="red" class="mr-2">mdi-youtube</v-icon>
                <v-icon v-else class="mr-2">mdi-video</v-icon>
                Информация о видео
                <v-chip 
                  v-if="result.platform" 
                  :color="result.platform === 'instagram' ? 'pink' : 'red'" 
                  variant="outlined" 
                  size="small" 
                  class="ml-2"
                >
                  {{ result.platform === 'instagram' ? 'Instagram' : 'YouTube' }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center mb-2">
                      <v-icon class="mr-2">mdi-account</v-icon>
                      <strong>Автор:</strong> {{ getVideoAuthor(result.data) }}
                    </div>
                    <div class="d-flex align-center mb-2">
                      <v-icon class="mr-2">mdi-heart</v-icon>
                      <strong>Лайки:</strong> {{ formatNumber(result.data.likes) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center mb-2">
                      <v-icon class="mr-2">mdi-comment</v-icon>
                      <strong>Комментарии:</strong> {{ formatNumber(getVideoComments(result.data)) }}
                    </div>
                    <div class="d-flex align-center mb-2">
                      <v-icon class="mr-2">mdi-eye</v-icon>
                      <strong>Просмотры:</strong> {{ formatNumber(getVideoViews(result.data)) }}
                    </div>
                  </v-col>
                </v-row>
                <div v-if="getVideoCaption(result.data)" class="mt-3">
                  <strong>{{ result.platform === 'youtube' ? 'Название:' : 'Описание:' }}</strong>
                  <p class="mt-1 text-body-2">{{ getVideoCaption(result.data) }}</p>
                </div>
              </v-card-text>
            </v-card>

            <!-- Скрипт -->
            <v-card variant="outlined">
              <v-card-title class="text-h6">
                <v-icon class="mr-2">mdi-script-text</v-icon>
                Скрипт видео
              </v-card-title>
              <v-card-text>
                <div class="script-content">
                  <pre>{{ result.response }}</pre>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="copyScript"
                  class="mr-2"
                >
                  <v-icon class="mr-2">mdi-content-copy</v-icon>
                  Копировать скрипт
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="downloadScript"
                >
                  <v-icon class="mr-2">mdi-download</v-icon>
                  Скачать как файл
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>

        <!-- Диалог переработки сценария -->
        <v-dialog v-model="reprocessDialog" max-width="1000px">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon class="mr-2">mdi-refresh</v-icon>
              Переработать сценарий под промпт
            </v-card-title>
            
            <v-card-text>
              <v-form ref="reprocessFormRef" @submit.prevent="reprocessScript">
                <v-select
                  v-model="reprocessForm.promptId"
                  label="Выберите промпт"
                  :items="prompts"
                  item-title="name"
                  item-value="id"
                  :rules="[rules.required]"
                  variant="outlined"
                  class="mb-4"
                  :loading="promptsStore.loading"
                  :disabled="promptsStore.loading"
                />
                
                <v-alert
                  v-if="reprocessForm.promptId"
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  <strong>Выбранный промпт:</strong>
                  <p class="mt-1">{{ getSelectedPromptText() }}</p>
                </v-alert>
                
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-h6">
                    <v-icon class="mr-2">mdi-file-document</v-icon>
                    Исходный сценарий
                  </v-card-title>
                  <v-card-text>
                    <div class="script-content">
                      <pre>{{ result?.response }}</pre>
                    </div>
                  </v-card-text>
                </v-card>
              </v-form>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="grey-darken-1"
                variant="text"
                @click="closeReprocessDialog"
              >
                Отмена
              </v-btn>
              <v-btn
                color="success"
                @click="reprocessScript"
                :loading="reprocessing"
                :disabled="reprocessing"
              >
                Переработать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог результата переработки -->
        <v-dialog v-model="reprocessResultDialog" max-width="1200px">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              Результат переработки
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-file-document</v-icon>
                      Исходный скрипт
                    </v-card-title>
                    <v-card-text>
                      <div class="script-content">
                        <pre>{{ reprocessResult?.originalScript }}</pre>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-file-document-edit</v-icon>
                      Переработанный скрипт
                    </v-card-title>
                    <v-card-text>
                      <div class="script-content">
                        <pre>{{ reprocessResult?.processedScript }}</pre>
                      </div>
                    </v-card-text>
                    <v-card-actions>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        @click="copyReprocessedScript"
                        class="mr-2"
                      >
                        <v-icon class="mr-2">mdi-content-copy</v-icon>
                        Копировать
                      </v-btn>
                      <v-btn
                        color="success"
                        variant="outlined"
                        @click="downloadReprocessedScript"
                      >
                        <v-icon class="mr-2">mdi-download</v-icon>
                        Скачать
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-card variant="outlined" class="mt-4">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2">mdi-text-box</v-icon>
                  Использованный промпт
                </v-card-title>
                <v-card-text>
                  <strong>{{ reprocessResult?.prompt?.name }}</strong>
                  <p class="mt-2">{{ reprocessResult?.prompt?.text }}</p>
                </v-card-text>
              </v-card>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                @click="reprocessResultDialog = false"
              >
                Закрыть
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Ошибка -->
        <v-card v-if="error" class="mb-6">
          <v-card-title class="text-h6 text-error">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            Ошибка
          </v-card-title>
          <v-card-text>
            <v-alert type="error" variant="tonal">
              {{ error }}
            </v-alert>
            <v-btn
              color="primary"
              @click="clearError"
              class="mt-3"
            >
              Попробовать снова
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- История запросов -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-history</v-icon>
              История запросов
            </div>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="loadHistory"
              :loading="historyLoading"
            />
          </v-card-title>
          
          <v-card-text v-if="historyLoading && history.length === 0">
            <div class="text-center py-4">
              <v-progress-circular indeterminate size="32" />
              <p class="mt-2">Загрузка истории...</p>
            </div>
          </v-card-text>
          
          <v-card-text v-else-if="!historyLoading && history.length === 0">
            <v-alert type="info" variant="tonal">
              У вас пока нет запросов на транскрибацию или переработку
            </v-alert>
          </v-card-text>
          
          <v-card-text v-else>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="item in history.slice(0, 10)"
                :key="item.id"
              >
                                 <v-expansion-panel-title>
                   <div class="d-flex align-center w-100">
                     <v-chip
                       :color="item.type === 'transcription' ? 'primary' : 'success'"
                       variant="flat"
                       size="small"
                       class="mr-3"
                     >
                       <v-icon
                         :icon="item.type === 'transcription' ? 'mdi-video-outline' : 'mdi-file-document-edit'"
                         start
                       />
                       {{ item.type === 'transcription' ? 'Транскрибация' : 'Переработка' }}
                     </v-chip>
                     
                     <div class="flex-grow-1">
                       <div class="text-truncate" style="max-width: 300px">
                         {{ item.result.substring(0, 80) }}{{ item.result.length > 80 ? '...' : '' }}
                       </div>
                       <small class="text-grey">{{ new Date(item.createdAt).toLocaleString('ru-RU') }}</small>
                     </div>
                   </div>
                 </v-expansion-panel-title>
                
                <v-expansion-panel-text>
                  <v-row>
                                         <!-- Основная информация -->
                     <v-col cols="12" md="6">
                       <div class="mb-3">
                         <strong>Дата:</strong> {{ new Date(item.createdAt).toLocaleString('ru-RU') }}
                       </div>
                       <div class="mb-3" v-if="item.processingTime">
                         <strong>Время обработки:</strong> {{ item.processingTime }}мс
                       </div>
                       <div class="mb-3" v-if="item.videoUrl">
                         <strong>URL видео:</strong>
                         <br>
                         <a :href="item.videoUrl" target="_blank" class="text-decoration-none">
                           {{ item.videoUrl }}
                           <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                         </a>
                       </div>
                       <div v-if="item.prompt">
                         <strong>Промпт:</strong> {{ item.prompt.name }}
                         <br>
                         <small>{{ item.prompt.text }}</small>
                       </div>
                     </v-col>
                    
                    <!-- Данные о видео -->
                    <v-col cols="12" md="6" v-if="item.videoData">
                      <div class="mb-2" v-if="item.videoData.platform" style="display: flex; align-items: center;">
                        <v-chip 
                          :color="item.videoData.platform === 'instagram' ? 'pink' : 'red'" 
                          variant="outlined" 
                          size="small"
                        >
                          <v-icon :icon="item.videoData.platform === 'instagram' ? 'mdi-instagram' : 'mdi-youtube'" start />
                          {{ item.videoData.platform === 'instagram' ? 'Instagram' : 'YouTube' }}
                        </v-chip>
                      </div>
                      <div class="mb-2" v-if="getVideoAuthor(item.videoData) !== 'Неизвестно'">
                        <strong>Автор:</strong> {{ getVideoAuthor(item.videoData) }}
                      </div>
                      <div class="mb-2" v-if="item.videoData.likes">
                        <strong>Лайки:</strong> {{ formatNumber(item.videoData.likes) }}
                      </div>
                      <div class="mb-2" v-if="getVideoComments(item.videoData)">
                        <strong>Комментарии:</strong> {{ formatNumber(getVideoComments(item.videoData)) }}
                      </div>
                      <div class="mb-2" v-if="getVideoViews(item.videoData)">
                        <strong>Просмотры:</strong> {{ formatNumber(getVideoViews(item.videoData)) }}
                      </div>
                    </v-col>
                  </v-row>
                  
                  <!-- Исходный скрипт для переработки -->
                  <div v-if="item.originalScript" class="mt-4">
                    <strong>Исходный скрипт:</strong>
                    <div class="script-content mt-2">
                      <pre>{{ item.originalScript }}</pre>
                    </div>
                  </div>
                  
                  <!-- Результат -->
                  <div class="mt-4">
                                         <div class="d-flex align-center justify-space-between mb-2">
                       <strong>Результат:</strong>
                     </div>
                    <div class="script-content">
                      <pre>{{ item.result }}</pre>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <div v-if="history.length > 10" class="text-center mt-4">
              <small class="text-grey">Показано 10 из {{ history.length }} записей</small>
            </div>
          </v-card-text>
        </v-card>

        <!-- Инструкции -->
        <v-card>
          <v-card-title class="text-h6">
            <v-icon class="mr-2">mdi-help-circle</v-icon>
            Как использовать
          </v-card-title>
          <v-card-text>
            <v-tabs v-model="instructionTab" color="primary" class="mb-4">
              <v-tab value="instagram">
                <v-icon class="mr-2">mdi-instagram</v-icon>
                Instagram
              </v-tab>
              <v-tab value="youtube">
                <v-icon class="mr-2">mdi-youtube</v-icon>
                YouTube
              </v-tab>
            </v-tabs>
            
            <v-tabs-window v-model="instructionTab">
              <v-tabs-window-item value="instagram">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="pink">mdi-numeric-1-circle</v-icon>
                    </template>
                    <v-list-item-title>Найдите видео в Instagram</v-list-item-title>
                    <v-list-item-subtitle>Откройте пост, Reel или IGTV</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="pink">mdi-numeric-2-circle</v-icon>
                    </template>
                    <v-list-item-title>Скопируйте ссылку</v-list-item-title>
                    <v-list-item-subtitle>Нажмите "Поделиться" → "Копировать ссылку"</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="pink">mdi-numeric-3-circle</v-icon>
                    </template>
                    <v-list-item-title>Вставьте ссылку выше</v-list-item-title>
                    <v-list-item-subtitle>И нажмите "Сгенерировать скрипт"</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-tabs-window-item>
              
              <v-tabs-window-item value="youtube">
                <v-alert type="info" variant="tonal" class="mb-4">
                  <v-icon slot="prepend">mdi-information</v-icon>
                  <strong>YouTube Shorts приоритизируются!</strong> Система оптимизирована для коротких видео.
                </v-alert>
                
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="red">mdi-numeric-1-circle</v-icon>
                    </template>
                    <v-list-item-title>Найдите YouTube Shorts или видео</v-list-item-title>
                    <v-list-item-subtitle>Лучше всего работает с YouTube Shorts (до 60 сек)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="red">mdi-numeric-2-circle</v-icon>
                    </template>
                    <v-list-item-title>Скопируйте ссылку</v-list-item-title>
                    <v-list-item-subtitle>Нажмите "Поделиться" → "Копировать ссылку" или скопируйте из адресной строки</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="red">mdi-numeric-3-circle</v-icon>
                    </template>
                    <v-list-item-title>Вставьте ссылку выше</v-list-item-title>
                    <v-list-item-subtitle>Поддерживаются: /watch?v=, /shorts/, youtu.be/</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-tabs-window-item>
            </v-tabs-window>
            
            <v-divider class="my-4" />
            
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-numeric-4-circle</v-icon>
                </template>
                <v-list-item-title>Переработайте скрипт (опционально)</v-list-item-title>
                <v-list-item-subtitle>Нажмите "Переработать сценарий" и выберите промпт для изменения стиля</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'
import { usePromptsStore } from '~/stores/prompts'
import type { Prompt } from '@prisma/client'

// Проверяем авторизацию
definePageMeta({
  middleware: 'auth'
})

interface ReprocessResult {
  originalScript: string
  processedScript: string
  prompt: {
    id: string
    name: string
    text: string
  }
}

const videoUrl = ref('')
const loading = ref(false)
const reprocessing = ref(false)
const result = ref<any>(null)
const error = ref<string>('')

// Store для промптов
const promptsStore = usePromptsStore()
const prompts = computed(() => promptsStore.list)

// Определение платформы по URL
const detectedPlatform = computed(() => {
  if (!videoUrl.value) return null
  if (/instagram\.com/.test(videoUrl.value)) return 'instagram'
  if (/(youtube\.com|youtu\.be)/.test(videoUrl.value)) return 'youtube'
  return null
})

// История запросов
const history = ref<any[]>([])
const historyLoading = ref(false)

// Диалоги
const reprocessDialog = ref(false)
const reprocessResultDialog = ref(false)

// Ссылка на форму переработки
const reprocessFormRef = ref()

const reprocessForm = ref({
  promptId: '',
  script: ''
})

const reprocessResult = ref<ReprocessResult | null>(null)

// Табы для инструкций
const instructionTab = ref('instagram')

// Правила валидации
const rules = {
  required: (v: string) => !!v || 'Обязательное поле',
  videoUrl: (v: string) => {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?/
    
    // Расширенная поддержка YouTube (включая Shorts и мобильные URL)
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    const youtubeShortsRegex = /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
    const youtubeMobileRegex = /^https?:\/\/m\.youtube\.com\/(watch\?v=|shorts\/)[a-zA-Z0-9_-]{11}/
    
    const isInstagram = instagramRegex.test(v)
    const isYoutube = youtubeRegex.test(v) || youtubeShortsRegex.test(v) || youtubeMobileRegex.test(v)
    
    return isInstagram || isYoutube || 'Некорректный URL. Поддерживаются Instagram видео/Reels и YouTube видео/Shorts'
  }
}

// Генерация скрипта
const generateScript = async () => {
  if (!videoUrl.value) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await axios.post('/api/video-script', {
      url: videoUrl.value
    })
    result.value = response.data
    
    // Загружаем промпты после успешной генерации скрипта
    await loadPrompts()
    
    // Обновляем историю
    await loadHistory()
  } catch (err: any) {
    error.value = err.response?.data?.statusMessage || err.message || 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}

// Загрузка промптов
const loadPrompts = async () => {
  try {
    await promptsStore.fetch()
  } catch (error: any) {
    console.error('Ошибка при загрузке промптов:', error)
  }
}

// Открытие диалога переработки
const openReprocessDialog = () => {
  if (!result.value?.response) return
  
  reprocessForm.value = {
    promptId: '',
    script: result.value.response
  }
  reprocessDialog.value = true
}

// Закрытие диалога переработки
const closeReprocessDialog = () => {
  reprocessDialog.value = false
  reprocessForm.value = {
    promptId: '',
    script: ''
  }
}

// Получение текста выбранного промпта
const getSelectedPromptText = () => {
  const prompt = prompts.value.find((p: Prompt) => p.id === reprocessForm.value.promptId)
  return prompt?.text || ''
}

// Переработка скрипта
const reprocessScript = async () => {
  // Проверяем валидацию формы
  if (reprocessFormRef.value) {
    const { valid } = await reprocessFormRef.value.validate()
    if (!valid) {
      return
    }
  }
  
  if (!reprocessForm.value.promptId || !result.value?.response) return
  
  reprocessing.value = true
  try {
    const response = await axios.post('/api/prompts/process-script', {
      promptId: reprocessForm.value.promptId,
      script: result.value.response
    })
    
    reprocessResult.value = response.data.data
    closeReprocessDialog()
    reprocessResultDialog.value = true
    
    // Обновляем историю
    await loadHistory()
  } catch (error: any) {
    console.error('Ошибка при переработке скрипта:', error)
  } finally {
    reprocessing.value = false
  }
}

// Очистка результата
const clearResult = () => {
  result.value = null
  videoUrl.value = ''
  reprocessResult.value = null
}

// Очистка ошибки
const clearError = () => {
  error.value = ''
}

// Копирование скрипта
const copyScript = async () => {
  if (!result.value?.response) return
  
  try {
    await navigator.clipboard.writeText(result.value.response)
  } catch (err) {
    console.error('Ошибка копирования:', err)
  }
}

// Скачивание скрипта
const downloadScript = () => {
  if (!result.value?.response) return
  
  const blob = new Blob([result.value.response], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `script_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Копирование переработанного скрипта
const copyReprocessedScript = async () => {
  if (!reprocessResult.value?.processedScript) return
  
  try {
    await navigator.clipboard.writeText(reprocessResult.value.processedScript)
  } catch (err) {
    console.error('Ошибка копирования:', err)
  }
}

// Скачивание переработанного скрипта
const downloadReprocessedScript = () => {
  if (!reprocessResult.value?.processedScript) return
  
  const blob = new Blob([reprocessResult.value.processedScript], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reprocessed_script_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Форматирование чисел
const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Функции для работы с историей
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const response = await axios.get('/api/history')
    history.value = response.data.data || []
  } catch (error) {
    console.error('Ошибка загрузки истории:', error)
    history.value = []
  } finally {
    historyLoading.value = false
  }
}



// Функции для получения данных видео в зависимости от платформы
const getVideoAuthor = (data: any) => {
  return data.ownerUsername || data.channelUsername || data.channelName || 'Неизвестно'
}

const getVideoComments = (data: any) => {
  return data.comments || data.commentsCount || 0
}

const getVideoViews = (data: any) => {
  return data.videoPlayCount || data.viewCount || 0
}

const getVideoCaption = (data: any) => {
  return data.caption || data.title || ''
}

// Загружаем промпты и историю при инициализации компонента
onMounted(() => {
  loadPrompts()
  loadHistory()
})
</script>

<style scoped>
.result-json {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.script-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.script-content pre {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: #333;
}

.v-card {
  border-radius: 12px;
}

.v-btn {
  border-radius: 8px;
}
</style> 