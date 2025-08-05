import { prisma } from '~/server/utils/prisma'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
    const platform = getRouterParam(event, 'platform')
    const searchType = getRouterParam(event, 'searchType')


    let ans: any[] = []
    if (searchType === 'profiles') {
        const usersRelationProfiles = await prisma.usersRelationProfiles.findMany({
            where: {
                userId: String(userData.id)
            }
        })

        ans = await prisma.profiles.findMany({
            where: {
                OR: usersRelationProfiles.map((v: any) => ({
                    platform: v.platform,
                    username: v.username
                }))
            }
        })
    } else if (searchType === 'hashtags') {
        const usersRelationHashtags = await prisma.usersRelationHashtag.findMany({
            where: {
                userId: String(userData.id)
            }
        })

        ans = await prisma.hashtag.findMany({
            where: {
                OR: usersRelationHashtags.map((v: any) => ({
                    platform: v.platform,
                    tag: v.tag
                }))
            }
        })
    }

    ans = ans.filter((item: any) => item.platform === platform)

    return ans
})
