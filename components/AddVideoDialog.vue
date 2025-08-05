<template>
    <v-dialog v-model="open" max-width="500" persistent>
        <v-card>
            <v-card-title>Add new video</v-card-title>
            <v-card-text>
                <v-text-field label="Video title" v-model="title" density="compact"/>
                <v-text-field label="Video URL"   v-model="url"   density="compact"/>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn text @click="open=false">Cancel</v-btn>
                <v-btn color="primary" :disabled="!title||!url" @click="submit">Add video</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useContentGeneration } from '@/composables/useContentGeneration'

    const open = defineModel<boolean>('modelValue')
    const { addVideo } = useContentGeneration()

    const title = ref('')
    const url   = ref('')

    function submit () {
        addVideo(title.value.trim(), url.value.trim())
        title.value = url.value = ''
        open.value = false
    }
</script>