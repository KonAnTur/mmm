<template>
  <button @click="handleLogout" class="logout-button">
    <span class="icon"></span>
    <span class="text">LOGOUT</span>
  </button>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  }
}
</script>

<style scoped>
.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #c82333;
}

.icon {
  font-size: 1.2em;
}

.text {
  font-size: 0.9em;
}
</style> 