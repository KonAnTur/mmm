<template>
    <v-data-table
        :items="videos"
        :headers="[
            { title:'Title',        value:'title' },
            { title:'URL',          value:'url' },
            { title:'Scheduled at', value:'scheduledAt' },
            { title:'Added',        value:'added' },
            { title:'Actions',      value:'actions', sortable:false }
        ]"
        class="elevation-1"
    >

        <template #item.scheduledAt="{ item }">
            {{ item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : '—' }}
        </template>
        <template #item.added="{ item }">{{ new Date(item.added).toLocaleString() }}</template>

        <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="error" @click="current=item.id; dlg=true">Delete</v-btn>
        </template>
    </v-data-table>

    <ConfirmDialog
        v-model="dlg"
        text="Delete this scheduled video?"
        confirm-label="Yes, delete"
        @confirm="current && removeVideo(current)"
    />
</template>

<script setup lang="ts">
    import { useContentScheduling } from '@/composables/useContentScheduling'
    import ConfirmDialog from './ConfirmDialog.vue'
    import { ref } from 'vue'
    const { videos, removeVideo } = useContentScheduling()

    const dlg = ref(false); const current = ref<string>()
</script>