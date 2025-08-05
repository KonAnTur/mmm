import { defineStore } from 'pinia'
import type { InstagramProfile } from '@prisma/client'
import axios from 'axios'

export const useProfilesStore = defineStore('profiles', {
    state:()=>({ list: [] as InstagramProfile[], loading:false }),
    actions:{
        async fetch(){
            this.loading = true
            const response = await axios.get<InstagramProfile[]>('/api/profiles')
            this.list = response.data
            this.loading = false
        },
        async add(username:string){
            await axios.post('/api/profiles',{username})
            await this.fetch()
        }
    }
})