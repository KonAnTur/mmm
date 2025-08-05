<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Переключатель между старым и новым способом входа -->
      <div class="login-tabs">
        <button 
          @click="activeTab = 'email'" 
          :class="{ active: activeTab === 'email' }"
          class="tab-button"
        >
          Вход через Email
        </button>
        <!-- <button 
          @click="activeTab = 'password'" 
          :class="{ active: activeTab === 'password' }"
          class="tab-button"
        >
          Старый способ
        </button> -->
      </div>

      <!-- Компоненты авторизации -->
      <EmailLoginForm v-if="activeTab === 'email'" />
      <LoginForm v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const activeTab = ref('email') // По умолчанию показываем новый способ
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

.login-tabs {
  display: flex;
  margin-bottom: 2rem;
  background: white;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: #f8f9fa;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.tab-button.active {
  background: #4a90e2;
  color: white;
}

.tab-button:hover:not(.active) {
  background: #e9ecef;
}
</style> 