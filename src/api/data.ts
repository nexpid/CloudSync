import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare";
import { validateSong } from "@song-spotlight/api/handlers";
import { UserDataSchema } from "@song-spotlight/api/structs";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getUser, TokenPayload } from "lib/auth";
import { deleteUserData, getUserData, saveUserData } from "lib/db";
import { HttpStatus } from "lib/http-status";
import { validate } from "lib/snowflake";
import { prettifyError } from "zod";

interface HonoConfig {
	Variables: {
		user: TokenPayload;
	};
	Bindings: Env;
}

const songLimit = IS_PRODUCTION ? 6 : 1000;
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
	const userId = c.get("user").userId;

	const data = await getUserData(userId);
	c.header("Last-Modified", data.at);
	return c.json(data?.data || null);
});

data.get("/:id", async function viewData(c) {
	const id = c.req.param("id");
	if (!validate(id)) {
		return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
	}

	const data = await getUserData(id);

	c.header("Last-Modified", data.at);
	return c.json(data.data);
});

data.put(
	"/:id?",
	validator("json", (value, c) => {
		const parsed = UserDataSchema.max(songLimit).safeParse(value);
		if (parsed.error) {
			return c.text(prettifyError(parsed.error), HttpStatus.BAD_REQUEST);
		}

		return parsed.data.filter((x, i) => !parsed.data.slice(0, i).includes(x));
	}),
	async function saveData(c) {
		const userId = c.get("user").userId;
		const data = c.req.valid("json");

		const id = c.req.param("id") || userId;
		if (!validate(id)) {
			return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
		}

		const allValidated = await Promise.allSettled(
			data.map((song) => validateSong(song)),
		);
		if (!allValidated.every((x) => x.status === "fulfilled" && x.value)) {
			return c.json(
				allValidated.map((v, i) => ({
					song: data[i],
					status: v.status === "fulfilled" ? !!v.value : "error",
				})),
				HttpStatus.BAD_REQUEST,
			);
		}

		let time = Date.now();
		if (id !== userId) {
			if (!process.env.ADMIN_USER_ID || userId !== process.env.ADMIN_USER_ID) {
				return c.text("Forbidden", HttpStatus.FORBIDDEN);
			}
			time = 0;
		}
		await saveUserData(id, data, new Date(time).toISOString());

		return c.json(true);
	},
);

data.delete("/", async function deleteData(c) {
	const userId = c.get("user").userId;

	await deleteUserData(userId);
	return c.json(true);
});

export default data;
