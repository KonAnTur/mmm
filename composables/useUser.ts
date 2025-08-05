import { ref } from 'vue'

export function useUser () {
    const name      = ref('Mihail')
    const plan      = ref<'Free'|'Pro'>('Free')
    const planEnds  = ref(new Date(Date.now() + 20 * 24 * 60 * 60 * 1e3)) // +20 дней

    return { name, plan, planEnds }
}