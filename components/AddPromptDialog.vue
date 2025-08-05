<template>
    <v-dialog v-model="dialog" persistent max-width="500">
        <v-card>
            <v-card-title>Add new prompt</v-card-title>
            <v-card-text class="pt-2">
                <v-text-field v-model="name" label="Enter name of the prompt" density="compact"/>
                <v-textarea  v-model="text" label="Enter text of the prompt" rows="6"/>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn text @click="dialog=false">Cancel</v-btn>
                <v-btn :disabled="!name||!text" color="primary" @click="submit">Add prompt</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { usePrompts } from '@/composables/usePrompts'

    const dialog = defineModel<boolean>('modelValue')
    const name = ref(''), text = ref('')

    import { usePromptsStore } from '@/stores/prompts'
    const store = usePromptsStore()

    async function submit(){
        await store.add({ name:name.value, text:text.value })
        name.value = text.value = ''
        dialog.value = false
    }
</script>