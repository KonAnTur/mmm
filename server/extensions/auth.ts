import { userService } from '../services/users';


export function defineAuthenticatedEventHandler<T>(
    handler: (event: any, body: T) => Promise<any>
) {
    return defineEventHandler(async (event: any) => {
        const accessToken = getHeader(event, "Authorization");
        if (!accessToken) {
            throw createError({
                statusCode: 401,
                statusMessage: "Пользователь не авторизован"
            });
        }
        
        // Убираем префикс "Bearer " из токена
        const token = accessToken.replace('Bearer ', '');
        
        const userData = userService.validateAccessToken(token);
        if (!userData) {
            throw createError({
                statusCode: 401,
                statusMessage: "Пользователь не авторизован"
            });
        }
        return handler(event, userData)
    })
}

