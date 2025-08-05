import { prisma } from '~/server/utils/prisma'
import { SearchTypeCreate } from '~/server/validators/searchType'
import crypto from 'crypto'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'
import { ParserService } from '~/server/utils/parser'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
    const platform = getRouterParam(event, 'platform')
    const searchType = getRouterParam(event, 'searchType')

    const body = SearchTypeCreate.parse(await readBody(event))

    try {
        if (searchType === 'profiles') {
            const newPost = await prisma.profiles.upsert({
                where: {
                    platform_username: {
                        platform: String(platform),
                        username: body.data
                    }
                },
                create: {
                    platform: String(platform),
                    username: body.data,
                    public: true
                },
                update: {
                    public: true
                }
            })

            await prisma.usersRelationProfiles.upsert({
                where: {
                    userId_platform_username: {
                        userId: userData.id,
                        platform: String(platform),
                        username: String(body.data)
                    }
                },
                create: {
                    userId: userData.id,
                    platform: String(platform),
                    username: String(body.data)
                },
                update: {}
            })

            // 🚀 Запускаем автоматический парсинг профиля при сохранении
            ParserService.parseProfileOnSave(String(platform), body.data, true)

            return newPost
        }
        
        if (searchType === 'hashtags') {
            const newHashtag = await prisma.hashtag.upsert({
                where: {
                    platform_tag: {
                        platform: String(platform),
                        tag: body.data
                    }
                },
                create: {
                    platform: String(platform),
                    tag: body.data
                },
                update: {}
            })

            await prisma.usersRelationHashtag.upsert({
                where: {
                    userId_platform_tag: {
                        userId: userData.id,
                        platform: String(platform),
                        tag: String(body.data)
                    }
                },
                create: {
                    userId: userData.id,
                    platform: String(platform),
                    tag: String(body.data)
                },
                update: {}
            })

            // 🏷️ Запускаем автоматический парсинг хештега при сохранении
            ParserService.parseHashtagOnSave(String(platform), body.data)
            
            return newHashtag
        }
    } catch (error) {
        throw createError({
            statusCode: 400,
            message: 'Ошибка при добавлении данных'
        })
    }
}) 