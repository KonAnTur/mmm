import { z } from 'zod'

export const SearchTypeCreate = z.object({
    data: z.string().min(1).max(4000)
})
