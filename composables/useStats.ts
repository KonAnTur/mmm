import { reactive } from 'vue'

export const stats = reactive([
    { title:'Competitors Tracker', key:'competitors', used:3, limit:10, to:'/instagram/competitors' },
    { title:'Hashtags Tracker',    key:'hashtags',   used:2, limit:10, to:'/instagram/hashtags' },
    { title:'AI Prompts',          key:'prompts',    used:2, limit:10, to:'/instagram/prompts' },
    { title:'Video Generation',    key:'videos_gen', used:3, limit:10, to:'/instagram/content' },
    { title:'Voice Generation',    key:'voice',      used:2, limit:10, to:'#' },
    { title:'Team Members',        key:'team',       used:2, limit:10, to:'#' }
])