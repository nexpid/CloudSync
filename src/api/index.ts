import { Hono } from "hono";

import auth from "./auth";
import data from "./data";

const api = new Hono();

api.route("/auth", auth);
api.route("/data", data);

export default api;
