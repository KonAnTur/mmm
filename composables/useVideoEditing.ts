import { ref } from 'vue'

export type EditVideo = {
    id: string
    title: string
    url: string
    added: Date
}

export type EditTag = {
    id: string
    tag: string
    added: Date
}

export function useVideoEditing () {
    const videos   = ref<EditVideo[]>([])
    const hashtags = ref<EditTag[]>([])

    /* videos */
    const addVideo = (title: string, url: string) =>
        videos.value.push({ id: Date.now().toString(), title, url, added: new Date() })
    const removeVideo = (id: string) =>
        (videos.value = videos.value.filter(v => v.id !== id))

    /* hashtags */
    const addTag = (tag: string) =>
        hashtags.value.push({ id: Date.now().toString(), tag, added: new Date() })
    const removeTag = (id: string) =>
        (hashtags.value = hashtags.value.filter(t => t.id !== id))

    return { videos, hashtags, addVideo, removeVideo, addTag, removeTag }
}