import { prisma } from '~/server/utils/prisma'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
    const platform = getRouterParam(event, 'platform')
    const searchType = getRouterParam(event, 'searchType')


    // Получаем связанные профили пользователя
    const usersRelationProfiles = await prisma.usersRelationProfiles.findMany({
        where: {
            userId: String(userData.id)
        }
    })

    console.log("usersRelationProfiles", usersRelationProfiles)

    // Получаем связанные хештеги пользователя
    const usersRelationHashtags = await prisma.usersRelationHashtag.findMany({
        where: {
            userId: String(userData.id),
            platform: platform
        }
    })


    const profiles: any[] = await prisma.profiles.findMany({
        where: {
            platform: platform,
            OR: usersRelationProfiles.map((v: any) => ({
                platform: v.platform,
                username: v.username
            }))
        }
    })


    const profilesFull: any[] = await prisma.profiles.findMany({
        where: {
            platform: platform
        }
    })


    // 🏷️ Определяем условие поиска в зависимости от типа запроса
    let whereCondition: any = {
        platform: platform,
        postType: 'Video',
        takenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
    }

    if (searchType === 'hashtags') {
        // Для хештегов показываем только видео по хештегам пользователя
        const userHashtags = usersRelationHashtags.map(h => h.tag)
        
        if (userHashtags.length === 0) {
            // Если у пользователя нет хештегов, возвращаем пустой массив
            return JSON.parse(JSON.stringify([], bigIntReplacer))
        }

        whereCondition = {
            ...whereCondition,
            hashtag: {
                in: userHashtags
            }
        }
        
        console.log('Поиск видео по пользовательским хештегам:', userHashtags)
    } else {
        // Для профилей используем старую логику
        whereCondition = {
            ...whereCondition,
            searchType: searchType,
            username: {
                in: profiles.map((v: any) => v.username)
            }
        }
    }

    const posts: any[] = await prisma.posts.findMany({
        where: whereCondition
    })


    const userMap = new Map(profilesFull.map(profile => [profile.username, profile]))
    const mapped = posts.map(video => {
        const user = userMap.get(video.username)
        const viralityValue = (user?.followers && video.videoPlayCount)
            ? Number(((Number(video.videoPlayCount) / Number(user.followers)) * 100).toFixed(0))
            : 0

        // 🏷️ Используем хештег из отдельного поля (если есть)
        const hashtag = video.hashtag || null

        return {
            ...video,
            virality: viralityValue ? viralityValue + '%' : '-',
            viralityValue, // для сортировки
            followers: user?.followers || 0,
            fullName: user?.displayName,
            profilePic: user?.profilePic,
            hashtag: hashtag, // 🏷️ Добавляем информацию о хештеге
        }
    }).sort((a, b) => b.viralityValue - a.viralityValue)

    return JSON.parse(JSON.stringify(mapped, bigIntReplacer))
})
