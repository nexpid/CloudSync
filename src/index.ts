import { Hono } from "hono";

import api from "./api";
import { runSilly } from "./silly";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.redirect("https://github.com/nexpid/CloudSync", 301));

app.route("/api", api);

export default {
	fetch: app.fetch,
	scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		if (controller.cron === "0 2 * * *") ctx.waitUntil(runSilly());
	},
};
