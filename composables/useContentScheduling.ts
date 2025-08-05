import { ref } from 'vue'

export type SchedVideo = {
    id: string
    title: string
    url: string
    /* Дата планируемой публикации — пока необязательна */
    scheduledAt?: Date
    added: Date
}

export type SchedTag = {
    id: string
    tag: string
    added: Date
}

export function useContentScheduling () {
    const videos   = ref<SchedVideo[]>([])
    const hashtags = ref<SchedTag[]>([])

    /* videos */
    const addVideo = (title: string, url: string, scheduledAt?: Date) =>
        videos.value.push({ id: Date.now().toString(), title, url, scheduledAt, added: new Date() })

    const removeVideo = (id: string) =>
        (videos.value = videos.value.filter(v => v.id !== id))

    /* hashtags */
    const addTag = (tag: string) =>
        hashtags.value.push({ id: Date.now().toString(), tag, added: new Date() })

    const removeTag = (id: string) =>
        (hashtags.value = hashtags.value.filter(h => h.id !== id))

    return { videos, hashtags, addVideo, removeVideo, addTag, removeTag }
}