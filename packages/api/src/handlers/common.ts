import { version } from "@";

interface RequestOptions {
	url: string;
	method?: string;
	query?: Record<string, string>;
	headers?: Record<string, string>;
	body?: unknown;
}

export function clean(link: string) {
	const url = new URL(link);
	url.protocol = "https";
	url.username =
		url.password =
		url.port =
		url.search =
		url.hash =
			"";

	return url.toString().replace(/\/?$/, "");
}

export async function request(options: RequestOptions) {
	if (options.body) {
		const body = JSON.stringify(options.body);
		options.body = body;

		options.headers ??= {};
		options.headers["content-type"] ??= "application/json";
		options.headers["content-length"] ??= String(body.length);
	}

	const url = new URL(options.url);
	for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, value);

	const res = await fetch(url, {
		method: options.method,
		redirect: "follow",
		headers: {
			"accept": "*/*",
			"user-agent": `song-spotlight/v${version}`,
			"cache-control": "public, max-age=3600",
			...options.headers,
		},
		// @ts-expect-error Untyped cloudflare workers cache type
		cf: {
			cacheTtl: 3600,
			cacheEverything: true,
		},
		body: options.body as never,
	});

	const text = await res.text();
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		json = null;
	}

	return {
		ok: res.ok,
		redirected: res.redirected,
		url: res.url,
		status: res.status,
		headers: res.headers,
		text,
		json,
	};
}

export function parseNextData<Type>(html: string) {
	const data = html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)?.[1];
	if (!data) return undefined;

	try {
		return JSON.parse(data) as Type;
	} catch {
		return undefined;
	}
}

// limit of 15 songs per playlist
export const PLAYLIST_LIMIT = 15;
