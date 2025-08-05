<template>
    <v-data-table
        :items="topVideos"
        class="elevation-1"
        :headers="[
            { title:'Video URL', value:'url' },
            { title:'Username', value:'username' },
            { title:'Thumbnail', value:'thumbnail', sortable:false },
            { title:'Caption', value:'caption' },
            { title:'Visibility', value:'visibility' },
            { title:'Views', value:'views' },
            { title:'Likes', value:'likes' },
            { title:'Comments', value:'comments' },
            { title:'Duration (sec)', value:'duration' },
            { title:'Published', value:'published' },
            { title:'Use as Template?', value:'template', sortable:false }
        ]"
    >

        <template #item.thumbnail="{ item }">
            <v-img :src="item.thumbnail" width="48" aspect-ratio="1"/>
        </template>

        <template #item.template="{ index }">
            <v-btn size="small" variant="text" color="error" @click="dialog=true; toIndex=index">
                Remove from Template
            </v-btn>
        </template>
    </v-data-table>

    <ConfirmDialog
        v-model="dialog"
        text="Video will be removed from Top Videos and all templates that use it. Are you sure?"
        confirm-label="Yes, remove"
        @confirm="removeVideo"
    />
</template>


<script setup lang="ts">
    import { useHashtags } from '@/composables/useHashtags'
    import ConfirmDialog from './ConfirmDialog.vue'
    import { ref } from 'vue'

    const { topVideos } = useHashtags()
    const dialog  = ref(false)
    const toIndex = ref<number | null>(null)

    function removeVideo () {
        if (toIndex.value == null) return
        topVideos.value.splice(toIndex.value, 1)
    }
</script>