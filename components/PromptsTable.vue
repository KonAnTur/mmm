<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { usePromptsStore } from '@/stores/prompts'
    import ConfirmDialog from './ConfirmDialog.vue'
    import EditPromptDialog from './EditPromptDialog.vue'

    const store = usePromptsStore()
    const rows = computed(()=>store.list)

    const editOpen = ref(false)
    const current  = ref(null)
    const delOpen  = ref(false)
</script>

<template>
    <v-data-table
        :items="rows"
        :loading="store.loading"
        :headers="[
        {title:'Prompt name',value:'name'},
        {title:'Prompt text',value:'text'},
        {title:'Actions',value:'actions',sortable:false}
        ]"
    >

        <template #item.text="{item}">
            <span style="white-space:pre-wrap;">{{ item.text }}</span>
        </template>

        <template #item.actions="{item}">
            <v-btn size="small" variant="text" @click="editOpen=true; current=item">Edit</v-btn>
            <v-btn size="small" variant="text" color="error" @click="delOpen=true; current=item">Delete</v-btn>
        </template>
    </v-data-table>

    <!-- dialogs -->
    <EditPromptDialog v-model="editOpen" :prompt="current" />
    <ConfirmDialog
        v-model="delOpen"
        text="Delete this prompt?"
        confirm-label="Yes, delete"
        @confirm="current && store.remove(current.id)"
    />
</template>