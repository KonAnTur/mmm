import { ref } from 'vue'

export type Hashtag = {
    tag: string
    dateAdded: Date
    firstSeenDate: Date
    lifespanDays: number
    trackingStatus: 'active' | 'paused'
    totalPostsFound: number
}

export function useHashtags () {
    const hashtags = ref<Hashtag[]>([])
    const topVideos   = ref<any[]>([])         // видео, найденные по тегам

    function add (tag: string) {
        const now = new Date()
        hashtags.value.push({
            tag,
            dateAdded: now,
            firstSeenDate: now,
            lifespanDays: 0,
            trackingStatus: 'active',
            totalPostsFound: 0
        })
    }

    function remove (tag: string) {
        hashtags.value = hashtags.value.filter(h => h.tag !== tag)
        topVideos.value = topVideos.value.filter(v => v.tag !== tag)
    }

    return { hashtags, topVideos, add, remove }
}
