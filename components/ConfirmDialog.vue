<template>
    <v-dialog v-model="dialog" max-width="360">
        <v-card>
            <v-card-text class="text-body-2">{{ props.text }}</v-card-text>

            <v-card-actions class="justify-end">
                <v-btn text @click="dialog=false">Cancel</v-btn>
                <v-btn color="error" @click="emits('confirm'); dialog=false">
                {{ props.confirmLabel ?? 'Remove' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { defineProps, defineEmits } from 'vue'
    const props = defineProps<{ text: string, confirmLabel?: string }>()
    const emits = defineEmits<{ confirm: [] }>()
    const dialog = defineModel<boolean>('modelValue')
</script>