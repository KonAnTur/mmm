<template>
    <v-data-table
        :items="videos"
        :headers="[
            { title:'Title', value:'title' },
            { title:'URL',   value:'url' },
            { title:'Added', value:'createdAt' },
            { title:'Actions', value:'actions', sortable:false }
        ]"
        class="elevation-1"
    >
  
        <template #item.createdAt="{ item }">{{ new Date(item.createdAt).toLocaleString() }}</template>
  
        <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="error"
                @click="current=item.id; delOpen=true">Delete</v-btn>
        </template>
    </v-data-table>
  
    <ConfirmDialog
        v-model="delOpen"
        text="Delete this video from Content Generation?"
        confirm-label="Yes, delete"
        @confirm="current && removeVideo(current)"
    />
</template>

<script setup lang="ts">
import { useContentGeneration } from '@/composables/useContentGeneration'
import ConfirmDialog from './ConfirmDialog.vue'
import { ref } from 'vue'

const { videos, removeVideo } = useContentGeneration()
const delOpen = ref(false)
const current = ref<string|undefined>()
</script>