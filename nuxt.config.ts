import { defineNuxtConfig } from 'nuxt/config'
import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
    css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css', '@/assets/main.scss'],
    build: {
        transpile: ['vuetify']
    },
    vite: {
        ssr: { noExternal: ['vuetify'] },
        plugins: [vuetify({ autoImport: true })]
    },
    modules: ['@pinia/nuxt',],
    nitro: {
        routeRules: {
            '/api/**': { cors: true }
        },
        runtimeConfig: {
            private: {
                jwt_access_key: process.env.JWT_ACCESS_KEY || 'jwt-secret-key',
                jwt_refresh_key: process.env.JWT_REFRESH_KEY || 'jwt-refresh-secret-key',
            },
            public: {
                apiBase: process.env.API_BASE || 'http://localhost:3000'
            }
        },
    },
    plugins: [
        '~/plugins/axios.ts'
    ]
})
