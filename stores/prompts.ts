import { defineStore } from 'pinia'
import type { Prompt } from '@prisma/client'
import axios from 'axios'

export const usePromptsStore = defineStore('prompts', {
    state:()=>({ list:[] as Prompt[], loading:false }),

    actions:{
        async fetch(){
            this.loading=true
            const response = await axios.get<Prompt[]>('/api/prompts')
            this.list = response.data
            this.loading=false
        },
        async add(payload:{name:string,text:string}){
            await axios.post('/api/prompts',payload)
            await this.fetch()
        },
        async update(id:string,payload:{name:string,text:string}){
            await axios.put(`/api/prompts/${id}`,payload)
            await this.fetch()
        },
        async remove(id:string){
            await axios.delete(`/api/prompts/${id}`)
            await this.fetch()
        }
    }
})