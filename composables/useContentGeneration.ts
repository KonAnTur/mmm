import { ref } from 'vue'

export type GenVideo = {
    id: string
    title: string
    url: string
    createdAt: Date
}

export type GenHashtag = {
    id: string
    tag: string
    addedAt: Date
}

export function useContentGeneration () {
    const videos   = ref<GenVideo[]>([])
    const hashtags = ref<GenHashtag[]>([])

    function addVideo (title: string, url: string) {
        videos.value.push({ id: Date.now().toString(), title, url, createdAt: new Date() })
    }
    function removeVideo (id: string) {
        videos.value = videos.value.filter(v => v.id !== id)
    }

    function addTag (tag: string) {
        hashtags.value.push({ id: Date.now().toString(), tag, addedAt: new Date() })
    }
    function removeTag (id: string) {
        hashtags.value = hashtags.value.filter(h => h.id !== id)
    }

    return { videos, hashtags, addVideo, removeVideo, addTag, removeTag }
}