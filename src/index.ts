/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Hono } from "hono";

import api from "./api";
import { TokenPayload } from "./lib/auth";
import { assignEnv } from "./lib/db";
import { HttpStatus } from "./lib/http-status";
import { logger } from "./lib/logger";
import { runSilly } from "./silly";

interface Variables {
	user?: TokenPayload;
}

const app = new Hono<{ Variables: Variables; Bindings: Env }>();

// Env assignment
app.use(async (c, next) => {
	assignEnv(c.env);
	await next();
});

// Error handling
app.use(async function errorHandler(c, next) {
	await next();
	if (!c.res) return;

	if (c.res.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
		logger.error(`Server error on ${c.req.method} ${c.req.path}`, {
			statusCode: c.res.status,
			userId: c.get("user")?.userId ?? null,
			response: await c.res.clone().text(),
		});
	} else if (c.res.status == HttpStatus.BAD_REQUEST) {
		logger.warn(`Client error on ${c.req.method} ${c.req.path}`, {
			statusCode: c.res.status,
			userId: c.get("user")?.userId ?? null,
			response: await c.res.clone().text(),
		});
	}
});

app.get("/", (c) => c.redirect("https://github.com/nexpid/CloudSync", 301));

app.route("/api", api);

export default {
	fetch: app.fetch,
	scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		assignEnv(env);
		if (controller.cron === "0 2 * * *") ctx.waitUntil(runSilly());
	},
};
