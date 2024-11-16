import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.redirect("https://github.com/nexpid/CloudSync", 301));

export default app;
