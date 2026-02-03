import { jwtVerify, SignJWT } from "jose";

export interface TokenPayload {
	userId: string;
}

const alg = "HS256";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const expirationTime = "1y";

export async function getUser(token?: string): Promise<TokenPayload | null> {
	if (!token) return null;

	try {
		const verified = await jwtVerify<TokenPayload>(token, secret, {
			algorithms: [alg],
		});
		return verified.payload;
	} catch {
		return null;
	}
}

export async function createToken(userId: string): Promise<string> {
	return await new SignJWT({
		userId,
	})
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setExpirationTime(expirationTime)
		.sign(secret);
}
