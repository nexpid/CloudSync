class CloudflareError extends Error {
	constructor(message?: string) {
		super(message);

		this.name = "CloudflareError";
	}
}

interface APIResult {
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
	results: unknown[];
	success: boolean;
}

interface APIResponseOk {
	success: true;
	result: APIResult[];
}
interface APIResponseErr {
	success: false;
	errors: {
		code: number;
		message: string;
	}[];
}
type APIResponse = APIResponseOk | APIResponseErr;

// this is kinda jank but it's the only thing that works lol
function isAPIResponseErr(res: APIResponse): res is APIResponseErr {
	return !res.success || "errors" in res;
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
		APIResult[]
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
		).json<APIResponse>();

		if (isAPIResponseErr(res)) {
			throw new CloudflareError(
				res.errors[0]
					? res.errors.map((x) => `[${x.code}] ${x.message}`).join(", ")
					: "Unknown error",
			);
		} else return res.result;
	}
}
