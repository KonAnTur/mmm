<template>
    <v-app>
        <v-container class="text-center py-16">
            <!-- Разные тексты для 404 и прочих ошибок -->
            <h1 class="text-h4 font-weight-bold mb-4">
                {{ props.error?.statusCode === 404 ? 'Страница не найдена (404)' : 'Ой, что-то пошло не так' }}
            </h1>

            <p v-if="props.error?.statusCode !== 404" class="text-body-2 mb-8">
                {{ props.error?.message || 'Неизвестная ошибка.' }}
            </p>

            <v-btn color="primary" @click="goHome">
                <v-icon start>mdi-home</v-icon>
                На главную
            </v-btn>
        </v-container>
    </v-app>
</template>

<script setup lang="ts">
    const props = defineProps<{ error: any }>()   // Nuxt передаёт сюда объект ошибки
    const router = useRouter()

    function goHome () {
        // здесь главная = корневой URL; при желании поменяйте на '/instagram/competitors'
        router.push('/instagram/profiles/videos')
    }
</script>