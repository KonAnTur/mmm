import { ref } from 'vue'

export type Prompt = {
    id: string
    name: string
    text: string
}

export function usePrompts () {
    const prompts = ref<Prompt[]>([])

    function add (name: string, text: string) {
        prompts.value.push({ id: Date.now().toString(), name, text })
    }

    function update (id: string, name: string, text: string) {
        const p = prompts.value.find(p => p.id === id)
        if (p) Object.assign(p, { name, text })
    }

    function remove (id: string) {
        prompts.value = prompts.value.filter(p => p.id !== id)
    }

    return { prompts, add, update, remove }
}
