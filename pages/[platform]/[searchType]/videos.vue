<template>
    <v-container fluid>

        <v-row align="center" justify="space-between" class="mb-3">
            <v-tabs v-model="tab" grow>
                <v-tab value="top">Top Videos</v-tab>
                <v-tab value="tracked">Tracked {{ searchType }}</v-tab>
            </v-tabs>

            <v-btn v-if="tab === 'tracked'" color="primary" @click="dialog = true">
                + add
            </v-btn>
        </v-row>

        <TopVideosTable v-if="tab === 'top'" :videos="videoStore.getVideos"/>
        <TrackedSearchTypeTable
            v-else
            :searchType="searchTypeStore.getSearchType"
            :headers="headers"
        />

        <AddSearchTypeDialog
            v-model="dialog"
            :titleText="`Add new ${searchType} for tracking`"
            :cardText="`Enter ${searchType}`"
            :platform="platform"
            :searchType="searchType"
        />
    </v-container>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useIntervalFn }  from '@vueuse/core'
    import { useVideosStore } from '@/stores/videos'
    import { useSearchTypeStore } from '@/stores/searchType'
    import { useRoute } from 'vue-router'
    import { createError } from 'h3'

    const route = useRoute()
    const platform = route.params.platform?.toString()
    const searchType = route.params.searchType?.toString()
    if (!platform || !searchType) {
        throw createError({ statusCode: 404, message: 'Platform or search type not found' })
    }

    const videoStore = useVideosStore()
    const searchTypeStore = useSearchTypeStore()

    const tab     = ref<'top' | 'tracked'>('top')
    const dialog  = ref(false)
    let headers = ref<any[]>([])
    if (searchType === 'profiles') {
        headers.value = [
            {title:'Username',   value:'username'},
            {title:'Full Name',  value:'fullName'},
            {title:'Followers',  value:'followers'},
            {title:'Following',  value:'following'},
            {title:'Posts',      value:'totalPosts'},
            {title:'Status',     value:'status'}
        ]
    } else if (searchType === 'hashtags') {
        headers.value = [
            {title:'Hashtag',   value:'tag'},
            {title:'Status',     value:'status'}
        ]
    }

    onMounted(() => {
        videoStore.fetch(platform, searchType)
        searchTypeStore.fetch(platform, searchType)
    })

    useIntervalFn(() => {
        videoStore.fetch(platform, searchType)
        searchTypeStore.fetch(platform, searchType)
    }, 30_000)
</script>