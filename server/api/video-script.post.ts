import { apifyService } from '~/server/services/apify'
import { instagramVideoSchema } from '~/server/validators/instagram'
import { youtubeVideoSchema } from '~/server/validators/youtube'
import { prisma } from '~/server/utils/prisma'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'
import ytdl from '@distube/ytdl-core'

import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Функция для ожидания активации файла
async function waitForFileActivation(fileName: string, maxAttempts: number = 10): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const file = await ai.files.get({ name: fileName });
            if (file.state === 'ACTIVE') {
                console.log(`Файл ${fileName} активирован на попытке ${attempt}`);
                return;
            }
            console.log(`Попытка ${attempt}: файл ${fileName} в состоянии ${file.state}`);
            
            // Ждем 2 секунды перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log(`Ошибка при проверке файла ${fileName}:`, error);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error(`Файл ${fileName} не активировался за ${maxAttempts} попыток`);
}

// Функция для определения платформы по URL
function detectPlatform(url: string): 'instagram' | 'youtub' | null {
    if (/instagram\.com/.test(url)) return 'instagram'
    if (/(youtube\.com|youtu\.be)/.test(url)) return 'youtub'
    return null
}

// Функция для скачивания YouTube видео
async function downloadYoutubeVideo(videoUrl: string): Promise<Buffer> {
    try {
        console.log('Начинаю скачивание YouTube видео:', videoUrl)
        
        // Получаем информацию о видео с дополнительными опциями
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        })
        
        // Выбираем лучший формат - приоритет mp4, среднее качество для быстрой загрузки
        let format = ytdl.chooseFormat(info.formats, { 
            quality: 'highest',
            filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio
        })
        
        // Fallback если mp4 с видео и аудио не найден
        if (!format) {
            format = ytdl.chooseFormat(info.formats, {
                quality: 'highest',
                filter: 'videoandaudio'
            })
        }
        
        if (!format) {
            throw new Error('Подходящий формат видео не найден')
        }
        
        console.log('Выбран формат:', format.quality, format.container)
        
        // Скачиваем видео в буфер с дополнительными опциями
        const chunks: Buffer[] = []
        const stream = ytdl(videoUrl, { 
            format,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        })
        
        return new Promise((resolve, reject) => {
            // Таймаут 5 минут для скачивания
            const timeout = setTimeout(() => {
                stream.destroy()
                reject(new Error('Таймаут скачивания YouTube видео (5 минут)'))
            }, 5 * 60 * 1000)

            stream.on('data', (chunk) => {
                chunks.push(chunk)
                console.log(`Скачано: ${Buffer.concat(chunks).length} байт`)
            })
            
            stream.on('end', () => {
                clearTimeout(timeout)
                const buffer = Buffer.concat(chunks)
                console.log('YouTube видео скачано:', buffer.length, 'байт')
                resolve(buffer)
            })
            
            stream.on('error', (error) => {
                clearTimeout(timeout)
                console.error('Ошибка при скачивании YouTube видео:', error)
                reject(error)
            })
        })
        
    } catch (error) {
        console.error('Ошибка при скачивании YouTube видео:', error)
        throw error
    }
}

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
    const startTime = Date.now()
    try {
        const body = await readBody(event)
        
        // Определяем платформу по URL
        const platform = detectPlatform(body.url)
        
        if (!platform) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Неподдерживаемая платформа. Поддерживаются только Instagram и YouTube'
            })
        }

        let validatedData: any
        let videoData: any
        let videoUrl: string | null = null

        if (platform === 'instagram') {
            validatedData = instagramVideoSchema.parse(body)
            videoData = await apifyService.parseInstagramVideo(validatedData.url)

            if (videoData.type !== 'Video') {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Некорректный тип видео'
                })
            }

            videoUrl = videoData.videoUrl as string
        } else if (platform === 'youtub') {
            validatedData = youtubeVideoSchema.parse(body)
            videoData = await apifyService.parseYoutubeVideo(validatedData.url)

            console.log('YouTube video data:', videoData)

            // Для YouTube скачиваем видео напрямую через ytdl-core
            try {
                const videoBuffer = await downloadYoutubeVideo(validatedData.url)
                const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })

                // Загружаем видео в Google GenAI
                const myfile = await ai.files.upload({
                    file: videoBlob,
                    config: { mimeType: "video/mp4" },
                });

                console.log(`YouTube видео загружено в Gemini: ${myfile.name}, состояние: ${myfile.state}`)

                // Ждем активации файла
                await waitForFileActivation(myfile.name as string)

                const response = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: createUserContent([
                        createPartFromUri(myfile.uri as string, myfile.mimeType as string),
                        "Write a script for this YouTube video, with all the dialog and meaningful actions. Focus on what is actually happening in the video. Just need a script, nothing more",
                    ]),
                });

                const processingTime = Date.now() - startTime

                // Сохраняем результат в историю
                try {
                    console.log('Сохраняю в историю анализ YouTube видео для пользователя:', userData.id)
                    
                    const historyVideoData = {
                        platform: 'youtub',
                        channelName: videoData.channelName,
                        channelUsername: videoData.channelUsername,
                        likes: videoData.likes,
                        viewCount: videoData.viewCount,
                        commentsCount: videoData.commentsCount,
                        title: videoData.title,
                        description: videoData.text || videoData.description,
                        analysisType: 'video' // Помечаем как анализ видео
                    }
                    
                    await (prisma as any).requestHistory.create({
                        data: {
                            type: 'transcription',
                            user: String(userData.id),
                            videoUrl: validatedData.url,
                            videoData: historyVideoData,
                            result: response.text,
                            processingTime: processingTime,
                            status: 'success'
                        }
                    })
                    console.log('Успешно сохранено в историю')
                } catch (dbError) {
                    console.error('Ошибка при сохранении в историю:', dbError)
                }

                return {
                    success: true,
                    platform: platform,
                    data: videoData,
                    message: 'YouTube видео успешно проанализировано',
                    response: response.text,
                    analysisType: 'video'
                }

            } catch (downloadError) {
                console.error('Ошибка при скачивании YouTube видео, fallback на анализ метаданных:', downloadError)
                
                // Fallback: анализ метаданных если скачивание не удалось
                const videoDescription = [
                    `Название: ${videoData.title || 'Без названия'}`,
                    `Канал: ${videoData.channelName || 'Неизвестный канал'}`,
                    `Длительность: ${videoData.duration || 'Неизвестно'}`,
                    `Описание: ${videoData.text || videoData.description || 'Описание отсутствует'}`,
                    `Просмотры: ${videoData.viewCount || 0}`,
                    `Лайки: ${videoData.likes || 0}`
                ].join('\n')

                const response = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: createUserContent([
                        `Создай скрипт для YouTube видео на основе следующей информации:\n\n${videoDescription}\n\nНапиши подробный скрипт с предполагаемыми диалогами и действиями в видео, основываясь на названии, описании и метаданных.`
                    ]),
                });

                const processingTime = Date.now() - startTime

                // Сохраняем fallback результат
                try {
                    const historyVideoData = {
                        platform: 'youtub',
                        channelName: videoData.channelName,
                        channelUsername: videoData.channelUsername,
                        likes: videoData.likes,
                        viewCount: videoData.viewCount,
                        commentsCount: videoData.commentsCount,
                        title: videoData.title,
                        description: videoData.text || videoData.description,
                        analysisType: 'metadata_fallback'
                    }
                    
                    await (prisma as any).requestHistory.create({
                        data: {
                            type: 'transcription',
                            user: String(userData.id),
                            videoUrl: validatedData.url,
                            videoData: historyVideoData,
                            result: response.text,
                            processingTime: processingTime,
                            status: 'success'
                        }
                    })
                } catch (dbError) {
                    console.error('Ошибка при сохранении fallback в историю:', dbError)
                }

                return {
                    success: true,
                    platform: platform,
                    data: videoData,
                    message: 'YouTube видео проанализировано по метаданным (скачивание недоступно)',
                    response: response.text,
                    analysisType: 'metadata_fallback'
                }
            }
        }

        // Скачиваем Instagram видео по URL
        if (!videoUrl) {
            throw createError({
                statusCode: 400,
                statusMessage: 'URL Instagram видео не найден'
            })
        }

        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Не удалось скачать Instagram видео'
            })
        }

        const videoBuffer = await videoResponse.arrayBuffer();
        const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });

        // Загружаем видео в Google GenAI
        const myfile = await ai.files.upload({
            file: videoBlob,
            config: { mimeType: "video/mp4" },
        });

        console.log(`Instagram видео загружено: ${myfile.name}, состояние: ${myfile.state}`);

        // Ждем активации файла
        await waitForFileActivation(myfile.name as string);

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: createUserContent([
                createPartFromUri(myfile.uri as string, myfile.mimeType as string),
                "Write a script for this video, with all the dialog and meaningful actions in the video. Just need a script, nothing more",
            ]),
        });

        const processingTime = Date.now() - startTime

        // Сохраняем результат в историю
        try {
            console.log('Сохраняю в историю транскрибацию для пользователя:', userData.id)
            
            // Подготавливаем данные видео в зависимости от платформы
            let historyVideoData: any
            
            if (platform === 'instagram') {
                historyVideoData = {
                    platform: 'instagram',
                    ownerUsername: videoData.ownerUsername,
                    likes: videoData.likes,
                    comments: videoData.comments,
                    videoPlayCount: videoData.videoPlayCount,
                    caption: videoData.caption
                }
            } else if (platform === 'youtub') {
                historyVideoData = {
                    platform: 'youtub',
                    channelName: videoData.channelName,
                    channelUsername: videoData.channelUsername,
                    likes: videoData.likes,
                    viewCount: videoData.viewCount,
                    commentsCount: videoData.commentsCount,
                    title: videoData.title,
                    description: videoData.text || videoData.description
                }
            }
            
            await (prisma as any).requestHistory.create({
                data: {
                    type: 'transcription',
                    user: String(userData.id),
                    videoUrl: validatedData.url,
                    videoData: historyVideoData,
                    result: response.text,
                    processingTime: processingTime,
                    status: 'success'
                }
            })
            console.log('Успешно сохранено в историю')
        } catch (dbError) {
            console.error('Ошибка при сохранении в историю:', dbError)
            // Не прерываем выполнение, если не удалось сохранить в БД
        }

        return {
            success: true,
            platform: platform,
            data: videoData,
            message: `${platform === 'instagram' ? 'Instagram' : 'YouTube'} видео успешно обработано`,
            response: response.text
        }
        
    } catch (error: any) {
        console.error('Ошибка при обработке видео:', error)
        if (error.name === 'ZodError') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Некорректные данные',
                data: {
                    errors: "Некорректные данные"
                }
            })
        }
        if (error.message?.includes('не найдено') || error.message?.includes('недоступно')) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Видео не найдено или недоступно'
            })
        }
        if (error.message?.includes('Неподдерживаемая платформа')) {
            throw createError({
                statusCode: 400,
                statusMessage: error.message
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Внутренняя ошибка сервера при обработке видео'
        })
    }
}) 