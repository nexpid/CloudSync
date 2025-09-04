# How to set up a D1 database

> [!NOTE]
> If you still have the `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_D1_BEARER_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` variables in `.dev.vars`, you can delete those and follow this guide instead

Song Spotlight uses an SQL [D1 database](https://developers.cloudflare.com/d1/) with the name of `VendettaSongSpotlight`[^1] to store user data.

## Steps

1. Pick a name and location (optional) for the database
   - You can list the available locations by running `bunx wrangler d1 create`
2. Create the database

   ```bash
   $ bunx wrangler d1 create [name] --location [location]
   ```

3. Copy the `database_name` and `database_id` values from the previous command and replace them in `wrangler.jsonc`
   - You may notice the database is there twice, which is intentional because otherwise wrangler shouts at me during development

4. Initialize the database both locally (miniflare) and on the real database

   ```bash
   $ bunx wrangler d1 execute DB --local --file ./schema.sql
   $ bunx wrangler d1 execute DB --remote --yes --file ./schema.sql
   ```

5. You're done!

[^1]: from the ye olden days, which is why it doesn't follow the [naming convention](https://developers.cloudflare.com/d1/get-started/#2-create-a-database) (cloudflare doesn't let you rename databases for whatever reason)
