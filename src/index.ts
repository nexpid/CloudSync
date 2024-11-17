import { Hono } from "hono";
import { assignEnv } from "./lib/env";
import { runSilly } from "./silly";
import api from "./api";

const app = new Hono<{ Bindings: Env }>();

app.use(async (c, next) => {
  assignEnv(c.env);
  await next();
});

app.get("/", (c) => c.redirect("https://github.com/nexpid/CloudSync", 301));

app.route("/api", api);

export default {
  fetch: app.fetch,
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    assignEnv(env);
    if (controller.cron === "0 2 * * *") ctx.waitUntil(runSilly());
  },
};
