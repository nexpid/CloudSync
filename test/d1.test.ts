// Tests a random D1 query

import { readFileSync } from "node:fs";
import { Cloudflare } from "../src/lib/cloudflare";

const { dbId, bearerToken, accountId } = JSON.parse(
	readFileSync("test/creds.json", "utf8"),
);

const cf = new Cloudflare(bearerToken, accountId);

cf.d1(dbId, {
	sql: "select * from data where user = ?",
	params: ["000000000000000000"],
})
	.then((x) => console.log(x[0].results[0]));
