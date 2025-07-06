import { jwtVerify, SignJWT } from "jose";
import { env } from "src/lib/env";

interface User {
	userId: string;
}

function key() {
	return new TextEncoder().encode(env.JWT_SECRET);
}

export async function getUser(auth: string): Promise<User | null> {
	if (!auth) return null;
	try {
		return (await jwtVerify<User>(auth, key())).payload;
	} catch {
		return null;
	}
}

export async function createToken(id: string): Promise<string> {
	return await new SignJWT({
		userId: id,
	})
		.setProtectedHeader({ alg: "HS256" })
		.sign(key());
}
