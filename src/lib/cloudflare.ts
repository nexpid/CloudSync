class CloudflareError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = "CloudflareError";
  }
}

export class Cloudflare {
  constructor(
    private bearerToken: string,
    private accountId: string,
  ) {}

  async d1(
    databaseId: string,
    params: { sql: string; params?: string[] },
  ): Promise<
    {
      meta: {
        served_by: string;
        duration: number;
        changes: number;
        last_row_id: number;
        changed_db: boolean;
        size_after: number;
        rows_read: number;
        rows_written: number;
      };
      results: any[];
      success: boolean;
    }[]
  > {
    const res = await (
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${databaseId}/query`,
        {
          method: "POST",
          body: JSON.stringify(params),
          headers: {
            "content-type": "application/json",
            authorization: "Bearer " + this.bearerToken,
          },
        },
      )
    ).json<any>();

    if (!res.success || !res.result)
      throw new CloudflareError(
        res.errors[0]
          ? res.errors.map((x: any) => `[${x.code}] ${x.message}`).join(", ")
          : "Unknown error",
      );
    else return res.result;
  }
}
