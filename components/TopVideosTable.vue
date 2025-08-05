<template>
    <v-data-table
        :items="rows"
        class="elevation-1"
        :headers="[
            {title:'Video URL', value:'url'},
            {title:'Username',  value:'username'},
            {title:'Video',     value:'video',   sortable:false},
            {title:'Thumbnail', value:'thumb',   sortable:false},
            {title:'Caption',   value:'caption'},
            {title:'Virality',  value:'virality'},
            {title:'Views',     value:'videoPlayCount'},
            {title:'Likes',     value:'likes'},
            {title:'Comments',  value:'comments'},
            {title:'Duration (sec)', value:'durationSec'},
            // {title:'Published', value:'postedAt'},
            // {title:'Use as Template?', value:'template', sortable:false}
        ]"
    >

        <template #item.video="{item}">
            <v-btn icon size="28" @click="window.open(item.mediaUrl,'_blank')">
                <v-icon>mdi-play</v-icon>
            </v-btn>
        </template>

        <template #item.thumb="{item}">
            <v-img :src="item.thumbnailUrl" width="48" height="48" v-if="item.thumbnailUrl"/>
        </template>

        <template #item.postedAt="{item}">
            {{ new Date(item.postedAt).toLocaleDateString() }}
        </template>

        <template #item.template="{item}">
            <v-btn
                size="small"
                :color="item.isTemplate ? 'error' : 'primary'"
                variant="text"
            >
                {{ item.isTemplate ? 'Remove from Templates' : 'Select Video' }}
            </v-btn>
        </template>
    </v-data-table>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    const props = defineProps<{
        videos: any[]
    }>()

    const rows = computed(() => props.videos)
</script>