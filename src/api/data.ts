import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getUser, TokenPayload } from "src/lib/auth";
import {
	deleteUserData,
	getUserData,
	retrieveUserData,
	saveUserData,
	UserDataSchema,
} from "src/lib/db";
import { decompressData } from "src/lib/db/conversion";
import { HttpStatus } from "src/lib/http-status";
import { prettifyError } from "zod";

interface HonoConfig {
	Variables: {
		user: TokenPayload;
	};
	Bindings: Env;
}

const data = new Hono<HonoConfig>();

// Authorization middleware
data.use(async (c, next) => {
	// Used as a bypass for iOs users on /raw, since RNFS is missing so the file can't be downloaded with code
	const user = await getUser(c.req.header("Authorization") ?? c.req.query("auth"));
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	c.set("user", user);
	await next();
});

// Ratelimit middleware
data.use(cloudflareRateLimiter<HonoConfig>({
	rateLimitBinding(c) {
		return c.env.USER_RATELIMIT;
	},
	keyGenerator(c) {
		return c.get("user").userId;
	},
}));

data.get("/", async function getData(c) {
	if (c.req.query("will-error")) {
		return c.text("The server is dead", HttpStatus.INTERNAL_SERVER_ERROR);
	}

	const user = c.get("user");

	try {
		const data = await getUserData(user.userId);

		c.header("Last-Modified", data?.at);
		return c.json(data?.data || null);
	} catch (e) {
		console.error("Uncaught data get err", e);
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

data.put(
	"/",
	validator("json", (value, c) => {
		const parsed = UserDataSchema.safeParse(value);
		if (parsed.error) {
			return c.text(prettifyError(parsed.error), HttpStatus.BAD_REQUEST);
		}

		return parsed.data;
	}),
	async function saveData(c) {
		const user = c.get("user"), data = c.req.valid("json");

		try {
			await saveUserData(user.userId, data, new Date().toISOString());
			return c.json(true);
		} catch (e) {
			console.error("Uncaught data put err", e);
			return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	},
);

data.delete("/", async function deleteData(c) {
	const user = c.get("user");

	try {
		await deleteUserData(user.userId);
		return c.json(true);
	} catch (e) {
		console.error("Uncaught data delete err", e);
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

data.get("/raw", async function downloadData(c) {
	const user = c.get("user");

	try {
		const data = await retrieveUserData(user.userId);
		if (!data) return c.body(null, HttpStatus.NO_CONTENT);

		const today = new Date().toISOString().replace(/T/, "_").replace(/:/g, "").replace(/\..+$/, "");

		c.header("content-type", "text/plain");
		c.header(
			"content-disposition",
			`attachment; filename="CloudSync-${today}.txt"`,
		);
		c.header("last-modified", data.at);
		return c.text(data.data);
	} catch (e) {
		console.error("Uncaught data raw err", e);
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

data.post("/decompress", async function decompressRawData(c) {
	const rawData = await c.req.text();

	try {
		Buffer.from(rawData, "base64"); // make sure data is base64
		return c.json(await decompressData(rawData));
	} catch (e) {
		return c.text(String(e), HttpStatus.BAD_REQUEST);
	}
});

export default data;
