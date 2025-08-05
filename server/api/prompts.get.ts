import { prisma } from '~/server/utils/prisma'
export default defineEventHandler(() =>
    prisma.prompt.findMany({ orderBy:{ createdAt:'desc' } })
)