import { UserLogin } from '~/server/validators/users'
import { userService } from '~/server/services/users'

export default defineEventHandler(async (event) => {
    try {
        const { username, password } = UserLogin.parse(await readBody(event))

        // Проверяем существование пользователя
        const user = await userService.validateUser(username, password)
        
        if (!user) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Неверный логин или пароль'
            })
        }

        const tokens = userService.createTokens({
            id: user.id,
            username: user.username
        })
        return tokens
    } catch (error) {
        console.log(error);
        throw error;
    }
});
