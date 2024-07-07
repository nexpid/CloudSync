import Cloudflare from "cloudflare";
import { readFileSync } from "fs";

const { dbId, bearerToken, accountId } = JSON.parse(
  readFileSync("test/creds.json", "utf8"),
);

const cf = new Cloudflare({
  apiToken: bearerToken,
});

cf.d1.database
  .query(dbId, {
    account_id: accountId,
    sql: "select * from data where user = ?",
    params: ["000000000000000000"],
  })
  .then((x) => console.log(x[0].results[0]));
