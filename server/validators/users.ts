import { z } from 'zod'

export const UserLogin = z.object({
    username: z.string().min(1).max(4000),
    password: z.string().min(1).max(4000)
})
