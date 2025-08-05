<template>
    <v-data-table
        :items="hashtags"
        class="elevation-1"
        :headers="[
            { title:'Hashtag', value:'tag' },
            { title:'Added',   value:'addedAt' },
            { title:'Actions', value:'actions', sortable:false }
        ]"
    >
  
        <template #item.addedAt="{ item }">{{ new Date(item.addedAt).toLocaleString() }}</template>
  
        <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="error"
                @click="current=item.id; delOpen=true">Delete</v-btn>
        </template>
    </v-data-table>
  
    <ConfirmDialog
        v-model="delOpen"
        text="Remove this hashtag from list?"
        confirm-label="Yes, remove"
        @confirm="current && removeTag(current)"
    />
</template>

<script setup lang="ts">
    import { useContentGeneration } from '@/composables/useContentGeneration'
    import ConfirmDialog from './ConfirmDialog.vue'
    import { ref } from 'vue'

    const { hashtags, removeTag } = useContentGeneration()
    const delOpen = ref(false)
    const current = ref<string|undefined>()
</script>

