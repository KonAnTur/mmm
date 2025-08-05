import { defineStore } from 'pinia'
import type { Hashtag } from '@prisma/client'

export const useHashtagsStore = defineStore('hashtags', {
    state:()=>({ list: [] as Hashtag[], loading:false }),

    actions:{
        async fetch(){
            this.loading = true
            this.list = await $fetch<Hashtag[]>('/api/hashtags')
            this.loading = false
        },
        async add(tag:string){
            await $fetch('/api/hashtags',{method:'POST',body:{tag}})
            await this.fetch()
        }
    }
})