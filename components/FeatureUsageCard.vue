<template>
    <v-card
      class="d-flex flex-column align-center justify-center py-4 text-center"
      min-height="120"
      :to="props.to"
      variant="outlined"
    >
        <div class="text-body-1 font-weight-medium">{{ props.title }}</div>
        <div class="text-subtitle-1 mt-1">{{ props.used }}/{{ props.limit }}</div>
    </v-card>
</template>

<script setup lang="ts">
    import { defineProps } from 'vue'
    const props = defineProps<{ title:string, used:number, limit:number, to:string }>()
</script>