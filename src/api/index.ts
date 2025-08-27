import { Hono } from "hono";
import { getUser } from "lib/auth";
import { HttpStatus } from "lib/http-status";
import { logger } from "lib/logger";

import auth from "./auth";
import data from "./data";

const api = new Hono();

api.get("/bench/:test", async function bench(c) {
	const userId = await getUser(c.req.header("Authorization")).then(user => user?.userId);
	if (!process.env.ADMIN_USER_ID || !userId || userId !== process.env.ADMIN_USER_ID) {
		return c.text("Forbidden", HttpStatus.FORBIDDEN);
	}

	const test = c.req.param("test");
	switch (test) {
		case "will-error-client": {
			return c.text("The client is dead", HttpStatus.BAD_REQUEST);
		}
		case "will-crash-server": {
			const error = new Error("The server is dead");

			logger.error("The server got a real and scary error!!!", { userId, error });
			return c.text(`Unknown error occurred: ${String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
		case "will-timeout": {
			// Wait for 20s (worker limit is 10s)
			await (() =>
				new Promise<void>(res => {
					setTimeout(() => res(), 60e3);
				}))();

			return c.body(null, HttpStatus.NO_CONTENT);
		}
		default: {
			return c.json(true, HttpStatus.IM_A_TEAPOT);
		}
	}
});

api.route("/auth", auth);
api.route("/data", data);

export default api;
