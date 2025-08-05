import axios from 'axios'
import { defineStore } from 'pinia'


export const useVideosStore = defineStore('videos', {
    state: () => ({
        list: [] as any[],
        loading:false
    }),
    getters:{
        getVideos: (state) => state.list
    },
    actions:{
        async fetch(platform:string, searchType:string) {
            this.loading = true
            const { data } = await axios.get<any[]>(`/api/${platform}/${searchType}/videos`)
            this.list = data
            this.loading = false
        }
    }
})
