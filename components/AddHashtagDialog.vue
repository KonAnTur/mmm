<template>
    <v-dialog v-model="dialog" max-width="400" persistent>
        <v-card>
            <v-card-title class="pb-0">Add new hashtag for tracking</v-card-title>
            
            <v-card-text>
                <v-text-field label="Enter hashtag" v-model="tag" density="compact"/>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn text @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" :disabled="!tag" @click="submit">Start tracking</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useHashtags } from '@/composables/useHashtags'
    import { useHashtagsStore } from '@/stores/hashtags'

    const store = useHashtagsStore()

    const dialog = defineModel<boolean>('modelValue')
    const tag    = ref('')

   
    async function submit(){
        await store.add(tag.value)
        dialog.value=false
        tag.value=''
    }
</script>

