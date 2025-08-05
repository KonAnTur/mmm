<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <!-- Заголовок -->
        <v-card class="mb-6">
          <v-card-title class="text-h4 text-center py-6">
            <v-icon size="large" class="mr-3">mdi-text-box-outline</v-icon>
            Управление промптами
          </v-card-title>
        </v-card>

        <!-- Кнопка создания -->
        <v-card class="mb-6">
          <v-card-actions>
            <v-btn
              color="primary"
              size="large"
              @click="openCreateDialog"
              prepend-icon="mdi-plus"
            >
              Создать новый промпт
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Список промптов -->
        <v-card>
          <v-card-title class="text-h5">
            <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
            Список промптов
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="prompts"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  @click="openEditDialog(item)"
                  class="mr-2"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              
              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              
              <template v-slot:item.updatedAt="{ item }">
                {{ formatDate(item.updatedAt) }}
              </template>
              
              <template v-slot:item.text="{ item }">
                <div class="text-truncate" style="max-width: 300px;">
                  {{ item.text }}
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Диалог создания/редактирования -->
        <v-dialog v-model="dialog" max-width="800px">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
              {{ isEditing ? 'Редактировать промпт' : 'Создать новый промпт' }}
            </v-card-title>
            
            <v-card-text>
              <v-form ref="form" @submit.prevent="savePrompt">
                <v-text-field
                  v-model="form.name"
                  label="Название промпта"
                  :rules="[rules.required, rules.maxLength]"
                  variant="outlined"
                  class="mb-4"
                  maxlength="120"
                  counter
                />
                
                <v-textarea
                  v-model="form.text"
                  label="Текст промпта"
                  :rules="[rules.required]"
                  variant="outlined"
                  rows="8"
                  auto-grow
                  class="mb-4"
                  placeholder="Опишите, как должен быть обработан сценарий..."
                />
              </v-form>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="grey-darken-1"
                variant="text"
                @click="closeDialog"
              >
                Отмена
              </v-btn>
              <v-btn
                color="primary"
                @click="savePrompt"
                :loading="saving"
                :disabled="saving"
              >
                {{ isEditing ? 'Обновить' : 'Создать' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог обработки сценария -->
        <v-dialog v-model="processDialog" max-width="1000px">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon class="mr-2">mdi-play-circle</v-icon>
              Обработать сценарий под промпт
            </v-card-title>
            
            <v-card-text>
              <v-form ref="processForm" @submit.prevent="processScript">
                <v-select
                  v-model="processForm.promptId"
                  label="Выберите промпт"
                  :items="prompts"
                  item-title="name"
                  item-value="id"
                  :rules="[rules.required]"
                  variant="outlined"
                  class="mb-4"
                />
                
                <v-textarea
                  v-model="processForm.script"
                  label="Вставьте сценарий для обработки"
                  :rules="[rules.required]"
                  variant="outlined"
                  rows="10"
                  auto-grow
                  class="mb-4"
                  placeholder="Вставьте сюда сценарий, который нужно обработать..."
                />
              </v-form>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="grey-darken-1"
                variant="text"
                @click="closeProcessDialog"
              >
                Отмена
              </v-btn>
              <v-btn
                color="success"
                @click="processScript"
                :loading="processing"
                :disabled="processing"
              >
                Обработать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог результата обработки -->
        <v-dialog v-model="resultDialog" max-width="1200px">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              Результат обработки
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-file-document</v-icon>
                      Исходный сценарий
                    </v-card-title>
                    <v-card-text>
                      <div class="script-content">
                        <pre>{{ processResult?.originalScript }}</pre>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-file-document-edit</v-icon>
                      Обработанный сценарий
                    </v-card-title>
                    <v-card-text>
                      <div class="script-content">
                        <pre>{{ processResult?.processedScript }}</pre>
                      </div>
                    </v-card-text>
                    <v-card-actions>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        @click="copyProcessedScript"
                        class="mr-2"
                      >
                        <v-icon class="mr-2">mdi-content-copy</v-icon>
                        Копировать
                      </v-btn>
                      <v-btn
                        color="success"
                        variant="outlined"
                        @click="downloadProcessedScript"
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
                  <strong>{{ processResult?.prompt?.name }}</strong>
                  <p class="mt-2">{{ processResult?.prompt?.text }}</p>
                </v-card-text>
              </v-card>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                @click="resultDialog = false"
              >
                Закрыть
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог подтверждения удаления -->
        <v-dialog v-model="deleteDialog" max-width="400px">
          <v-card>
            <v-card-title class="text-h6">
              <v-icon class="mr-2 text-error">mdi-alert-circle</v-icon>
              Подтверждение удаления
            </v-card-title>
            
            <v-card-text>
              Вы уверены, что хотите удалить промпт "{{ promptToDelete?.name }}"?
              Это действие нельзя отменить.
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="grey-darken-1"
                variant="text"
                @click="deleteDialog = false"
              >
                Отмена
              </v-btn>
              <v-btn
                color="error"
                @click="deletePrompt"
                :loading="deleting"
                :disabled="deleting"
              >
                Удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Снэкбар для уведомлений -->
        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="3000"
        >
          {{ snackbar.text }}
          <template v-slot:actions>
            <v-btn
              color="white"
              text
              @click="snackbar.show = false"
            >
              Закрыть
            </v-btn>
          </template>
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'

// Проверяем авторизацию
definePageMeta({
  middleware: 'auth'
})

interface Prompt {
  id: string
  name: string
  text: string
  user: string
  createdAt: string
  updatedAt: string
}

interface ProcessResult {
  originalScript: string
  processedScript: string
  prompt: {
    id: string
    name: string
    text: string
  }
}

const prompts = ref<Prompt[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const processing = ref(false)
const dialog = ref(false)
const processDialog = ref(false)
const resultDialog = ref(false)
const deleteDialog = ref(false)
const isEditing = ref(false)
const promptToDelete = ref<Prompt | null>(null)
const processResult = ref<ProcessResult | null>(null)

const form = ref({
  id: '',
  name: '',
  text: ''
})

const processForm = ref({
  promptId: '',
  script: ''
})

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Заголовки таблицы
const headers = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Текст', key: 'text', sortable: false },
  { title: 'Создан', key: 'createdAt', sortable: true },
  { title: 'Обновлен', key: 'updatedAt', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Правила валидации
const rules = {
  required: (v: string) => !!v || 'Обязательное поле',
  maxLength: (v: string) => v.length <= 120 || 'Максимум 120 символов'
}

// Загрузка промптов
const loadPrompts = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/prompts')
    prompts.value = response.data
  } catch (error: any) {
    showSnackbar('Ошибка при загрузке промптов', 'error')
  } finally {
    loading.value = false
  }
}

// Открытие диалога создания
const openCreateDialog = () => {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    text: ''
  }
  dialog.value = true
}

// Открытие диалога редактирования
const openEditDialog = (prompt: Prompt) => {
  isEditing.value = true
  form.value = {
    id: prompt.id,
    name: prompt.name,
    text: prompt.text
  }
  dialog.value = true
}

// Открытие диалога обработки
const openProcessDialog = () => {
  processForm.value = {
    promptId: '',
    script: ''
  }
  processDialog.value = true
}

// Закрытие диалога
const closeDialog = () => {
  dialog.value = false
  form.value = {
    id: '',
    name: '',
    text: ''
  }
}

// Закрытие диалога обработки
const closeProcessDialog = () => {
  processDialog.value = false
  processForm.value = {
    promptId: '',
    script: ''
  }
}

// Сохранение промпта
const savePrompt = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      await axios.put(`/api/prompts/${form.value.id}`, {
        name: form.value.name,
        text: form.value.text
      })
      showSnackbar('Промпт успешно обновлен')
    } else {
      await axios.post('/api/prompts', {
        name: form.value.name,
        text: form.value.text
      })
      showSnackbar('Промпт успешно создан')
    }
    
    closeDialog()
    await loadPrompts()
  } catch (error: any) {
    showSnackbar(error.response?.data?.statusMessage || 'Ошибка при сохранении', 'error')
  } finally {
    saving.value = false
  }
}

// Обработка сценария
const processScript = async () => {
  processing.value = true
  try {
    const response = await axios.post('/api/prompts/process-script', {
      promptId: processForm.value.promptId,
      script: processForm.value.script
    })
    
    processResult.value = response.data.data
    closeProcessDialog()
    resultDialog.value = true
    showSnackbar('Сценарий успешно обработан')
  } catch (error: any) {
    showSnackbar(error.response?.data?.statusMessage || 'Ошибка при обработке сценария', 'error')
  } finally {
    processing.value = false
  }
}

// Копирование обработанного сценария
const copyProcessedScript = async () => {
  if (!processResult.value?.processedScript) return
  
  try {
    await navigator.clipboard.writeText(processResult.value.processedScript)
    showSnackbar('Сценарий скопирован в буфер обмена')
  } catch (err) {
    console.error('Ошибка копирования:', err)
    showSnackbar('Ошибка при копировании', 'error')
  }
}

// Скачивание обработанного сценария
const downloadProcessedScript = () => {
  if (!processResult.value?.processedScript) return
  
  const blob = new Blob([processResult.value.processedScript], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `processed_script_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showSnackbar('Сценарий скачан')
}

// Подтверждение удаления
const confirmDelete = (prompt: Prompt) => {
  promptToDelete.value = prompt
  deleteDialog.value = true
}

// Удаление промпта
const deletePrompt = async () => {
  if (!promptToDelete.value) return
  
  deleting.value = true
  try {
    await axios.delete(`/api/prompts/${promptToDelete.value.id}`)
    showSnackbar('Промпт успешно удален')
    deleteDialog.value = false
    promptToDelete.value = null
    await loadPrompts()
  } catch (error: any) {
    showSnackbar(error.response?.data?.statusMessage || 'Ошибка при удалении', 'error')
  } finally {
    deleting.value = false
  }
}

// Показать уведомление
const showSnackbar = (text: string, color: string = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// Форматирование даты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU')
}

// Загружаем промпты при монтировании компонента
onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-card {
  border-radius: 12px;
}

.v-btn {
  border-radius: 8px;
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
</style> 