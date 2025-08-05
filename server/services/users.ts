import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'




class UserService {
    jwt_access_key = "jwt-secret-key"
    jwt_refresh_key = "jwt-refresh-secret-key"

    validateAccessToken(accessToken: string) {
        try {
            console.log(accessToken)
            const userData = jwt.verify(accessToken, this.jwt_access_key);
            return userData;
        }
        catch (error) {
            return null;
        }
    }

    validateRefreshToken(refreshToken: string) {
        try {
            const userData = jwt.verify(refreshToken, this.jwt_refresh_key);
            return userData;
        }
        catch (error) {
            return null;
        }
    }

    createTokens(payload: any) {
        const accessToken = jwt.sign(payload, this.jwt_access_key, {expiresIn: '180d'});
        const refreshToken = jwt.sign(payload, this.jwt_refresh_key, {expiresIn: '1800d'});
        return { accessToken, refreshToken };
    }


    async refreshSessionToken(refreshToken: string) {
        const userData: any = this.validateRefreshToken(refreshToken)
        if (userData) {
            return this.createTokens(userData);
        }
    }

    async validateUser(username: string, password: string) {
        try {
            const user = await prisma.users.findFirst({
                where: {
                    username: username,
                    password: password
                }
            });
            return user;
        } catch (error) {
            console.error('Ошибка при проверке пользователя:', error);
            return null;
        }
    }
}

export const userService = new UserService()