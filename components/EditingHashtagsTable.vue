<template>
    <v-data-table
        :items="hashtags"
        class="elevation-1"
        :headers="[
            { title:'Hashtag', value:'tag' },
            { title:'Added',   value:'added' },
            { title:'Actions', value:'actions', sortable:false }
        ]"
    >
  
        <template #item.added="{ item }">{{ new Date(item.added).toLocaleString() }}</template>
        <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="error"
                @click="current=item.id; dlg=true">Delete</v-btn>
        </template>
    </v-data-table>
  
    <ConfirmDialog
        v-model="dlg"
        text="Remove this hashtag?"
        confirm-label="Yes, remove"
        @confirm="current && removeTag(current)"
    />
</template>

<script setup lang="ts">
    import { useVideoEditing } from '@/composables/useVideoEditing'
    import ConfirmDialog from './ConfirmDialog.vue'
    import { ref } from 'vue'

    const { hashtags, removeTag } = useVideoEditing()
    const dlg = ref(false); const current = ref<string>()
</script>