<template>
    <v-dialog v-model="open" max-width="500">
        <v-card>
            <v-card-title>Edit prompt</v-card-title>
            <v-card-text>
                <v-text-field  label="Edit prompt name" v-model="name" density="compact"/>
                <v-textarea    label="Edit prompt text" v-model="text" rows="6"/>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn text @click="open=false">Cancel</v-btn>
                <v-btn color="primary" :disabled="!name||!text" @click="save">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue'
    import { usePrompts, type Prompt } from '@/composables/usePrompts'

    const props = defineProps<{ modelValue: boolean, prompt: Prompt|null }>()
    const emit  = defineEmits(['update:modelValue'])
    const { update } = usePrompts()

    const open = ref(false)
    watch(() => props.modelValue, v => open.value = v)
    watch(() => open.value, v => emit('update:modelValue', v))

    const name = ref(''), text = ref('')

    watch(() => props.prompt, p => {
        if (p) { name.value = p.name; text.value = p.text }
    })

    function save () {
        if (props.prompt) update(props.prompt.id, name.value.trim(), text.value.trim())
        open.value = false
    }
</script>