<template>
    <v-app>
        <Sidebar/>
        <v-main class="bg-grey-lighten-4">
            <slot/>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
</script>

<style scoped>
    .v-main {
        padding-left: 240px;
    }
</style>