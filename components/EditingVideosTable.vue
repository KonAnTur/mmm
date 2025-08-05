<template>
    <v-data-table
        :items="videos"
        :headers="[
            { title:'Title', value:'title' },
            { title:'URL',   value:'url' },
            { title:'Added', value:'added' },
            { title:'Actions', value:'actions', sortable:false }
        ]"
        class="elevation-1"
    >
  
        <template #item.added="{ item }">{{ new Date(item.added).toLocaleString() }}</template>
        <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="error"
                @click="current=item.id; dlg=true">Delete</v-btn>
        </template>
    </v-data-table>
  
    <ConfirmDialog
        v-model="dlg"
        text="Delete this video from Video Editing?"
        confirm-label="Yes, delete"
        @confirm="current && removeVideo(current)"
    />
</template>

<script setup lang="ts">
    import { useVideoEditing } from '@/composables/useVideoEditing'
    import ConfirmDialog from './ConfirmDialog.vue'
    import { ref } from 'vue'

    const { videos, removeVideo } = useVideoEditing()
    const dlg = ref(false); const current = ref<string>()
</script>