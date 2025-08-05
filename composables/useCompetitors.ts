import { ref } from 'vue'

export type Competitor = {
    username: string
    displayName: string
    profilePic: string
    profileBio: string
    followers: number
    following: number
    latestVideo: string
    comments: number
}

export function useCompetitors () {
    const competitors = ref<Competitor[]>([])
    const topVideos = ref<any[]>([]) // заменить на строгий тип, если нужно

    function add(c: Competitor) { competitors.value.push(c) }
    function remove(username: string) {
        competitors.value = competitors.value.filter(c => c.username !== username)
        // Также чистим topVideos, если надо
        topVideos.value = topVideos.value.filter(v => v.username !== username)
    }

    return { competitors, topVideos, add, remove }
}
