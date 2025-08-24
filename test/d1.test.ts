// Tests a random D1 query

import { Cloudflare } from "../src/lib/cloudflare";

const { dbId, bearerToken, accountId } = await Bun.file("test/creds.json").json() as {
	dbId: string;
	bearerToken: string;
	accountId: string;
};

const cf = new Cloudflare(bearerToken, accountId);

await cf.d1(dbId, {
	sql: "select * from data where user = ?",
	params: ["000000000000000000"],
})
	.then((x) => console.log(x[0]?.results[0]));
