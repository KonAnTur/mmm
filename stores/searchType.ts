import axios from 'axios'
import { defineStore } from 'pinia'


export const useSearchTypeStore = defineStore('searchType', {
    state: () => ({
        list: [] as any[],
        loading:false
    }),
    getters:{
        getSearchType: (state) => state.list
    },
    actions:{
        async fetch(platform:string, searchType:string) {
            this.loading = true
            const { data } = await axios.get<any[]>(`/api/${platform}/${searchType}/search-type`)
            this.list = data
            this.loading = false
        },

        async add(platform:string, searchType:string, info: string) {
            const { data } = await axios.post<any[]>(
                `/api/${platform}/${searchType}/search-type`,
                {
                    data: info
                }
            )
            this.list.push(data)
        }
    }
})
