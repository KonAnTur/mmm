<template>
    <v-dialog v-model="dialog" persistent max-width="400">
        <v-card>
            <v-card-title class="pb-0">{{ props.titleText }}</v-card-title>

            <v-card-text>
                <v-text-field
                :label="props.cardText"
                v-model="dataValue"
                density="compact"/>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn text @click="dialog=false">Cancel</v-btn>
                <v-btn
                    color="primary"
                    :disabled="!dataValue"
                    @click="submit"
                >
                    Start tracking
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>


<script setup lang="ts">
    import { ref } from 'vue'

    const props = defineProps<{
        titleText: string
        cardText: string
        platform: string
        searchType: string
    }>()

    const searchTypeStore = useSearchTypeStore()

    const dialog = defineModel<boolean>('modelValue')
    const dataValue = ref('')

    
    async function submit(){
        await searchTypeStore.add(props.platform, props.searchType, dataValue.value)
        dialog.value=false
        dataValue.value=''
    }
</script>
