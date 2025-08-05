<template>
    <v-card variant="outlined" min-height="150" class="pa-3 d-flex flex-column">
        <div class="text-body-1 font-weight-medium mb-1">{{ props.title }}</div>
        <div class="text-caption line-clamp">{{ props.text }}</div>
        <v-spacer/>
        <v-btn variant="text" class="self-end text-caption" size="x-small">Learn more &gt;&gt;</v-btn>
    </v-card>
</template>

<script setup lang="ts">
    const props = defineProps<{ title:string, text:string }>()
</script>

<style scoped>
    .line-clamp {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>