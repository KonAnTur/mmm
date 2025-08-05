<template>
  <div class="email-login-form">
    <form @submit.prevent="handleSubmit" class="form">
      <h2 class="form-title">Вход через Email</h2>
      
      <!-- Этап ввода email -->
      <div v-if="!codeSent" class="form-step">
        <div class="form-group">
          <label for="email">Email адрес</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="form-input"
            placeholder="Введите ваш email"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="loading">
          {{ loading ? 'Отправка...' : 'Отправить код' }}
        </button>
      </div>

      <!-- Этап ввода кода -->
      <div v-else class="form-step">
        <div class="success-message">
          ✅ Код подтверждения отправлен на {{ email }}
        </div>
        
        <div class="info-notice">
          📧 Проверьте вашу почту (включая папку "Спам"). Код действителен 10 минут.
        </div>
        
        <div class="form-group">
          <label for="code">Код подтверждения</label>
          <input
            id="code"
            v-model="verificationCode"
            type="text"
            maxlength="6"
            required
            class="form-input code-input"
            placeholder="000000"
            @input="onCodeInput"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="loading || verificationCode.length !== 6">
          {{ loading ? 'Проверка...' : 'Войти' }}
        </button>

        <button type="button" @click="goBack" class="back-button">
          Изменить email
        </button>

        <button 
          type="button" 
          @click="resendCode" 
          class="resend-button"
          :disabled="resendLoading"
        >
          {{ resendLoading ? 'Отправка...' : 'Отправить код повторно' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const verificationCode = ref('')
const error = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const codeSent = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (!codeSent.value) {
      // Отправляем код на email
      await authStore.sendVerificationCode(email.value)
      codeSent.value = true
    } else {
      // Верифицируем код и входим
      await authStore.verifyCodeAndLogin(email.value, verificationCode.value)
      router.push('/instagram/profiles/videos')
    }
    
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const onCodeInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Оставляем только цифры
  target.value = target.value.replace(/\D/g, '')
  verificationCode.value = target.value
}

const goBack = () => {
  codeSent.value = false
  verificationCode.value = ''
  error.value = ''
}

const resendCode = async () => {
  try {
    resendLoading.value = true
    error.value = ''
    
    await authStore.sendVerificationCode(email.value)
    error.value = ''
    
  } catch (e: any) {
    error.value = e.message
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.email-login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-step {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.code-input {
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.2rem;
  font-weight: bold;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 1rem;
}

.submit-button:hover:not(:disabled) {
  background-color: #357abd;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-button, .resend-button {
  width: 100%;
  padding: 0.5rem;
  background-color: transparent;
  color: #4a90e2;
  border: 1px solid #4a90e2;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.back-button:hover, .resend-button:hover:not(:disabled) {
  background-color: #4a90e2;
  color: white;
}

.resend-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
}

.success-message {
  color: #28a745;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}

.info-notice {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  border: 1px solid #bbdefb;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style> 