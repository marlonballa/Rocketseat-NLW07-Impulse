import axios from 'axios';
import { prismaClient } from '../prisma/index';
import { sign } from "jsonwebtoken";
interface IAccessTokenResponse {
    access_token: string;
}

interface iUserResponse {
    avatar_url: string,
    login: string,
    id: number,
    name: string
}

class AuthenticateUserService {
    async execute(code: string) {
        const url = "https://github.com/login/oauth/access_token";

        const { data: accesTokenResponse } = await axios.post<IAccessTokenResponse>(url, null, {
            params: {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            headers: {
                "Accept": "application/json"
            }
        })

        const response = await axios.get<iUserResponse>("https://api.github.com/user", {
            headers: {
                authorization: `Bearer ${accesTokenResponse.access_token}`
            }
        })

        const { login, id, avatar_url, name } = response.data

        let user = await prismaClient.user.findFirst({
            where: {
                githubId: id
            }
        })

        if (!user) {
            user = await prismaClient.user.create({
                data: {
                    githubId: id,
                    login,
                    avatarUrl,
                    nameUser
                }
            })
        }

        const token = sign({
            user: {
                name: user.nameUser,
                avatar_url: user.avatarUrl,
                id: user.id
            },
            process.env.JWT_SECRET,
        {
                subject: user.id,
                expiresIn: "1d"
        }
    });

        return { token, user}
    }
}

export { AuthenticateUserService }