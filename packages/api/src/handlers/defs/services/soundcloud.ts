import { PLAYLIST_LIMIT, request } from "handlers/common";
import { parseLink } from "handlers/finders";
import { type RenderInfoBase, type RenderInfoEntryBased, type SongService } from "handlers/helpers";

interface oEmbedData {
	html: string;
}

interface Transcoding {
	duration: number;
	url: string;
	format: {
		protocol: string;
	};
}

interface WidgetData {
	artwork_url: string;
	avatar_url?: string;
	title: string;
	id: number;
	permalink_url: string;
	username?: string;
	user?: {
		username: string;
	};
	publisher_metadata?: {
		explicit: boolean;
	};
	media?: {
		transcodings: Transcoding[];
	};
	tracks?: WidgetData[];
}

interface TracksWidgetData {
	collection: WidgetData[];
}

interface PreviewResponse {
	url: string;
}

const client_id = "nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic";

async function parseWidget<Tracks extends boolean>(type: string, id: string, tracks: Tracks) {
	return (await request({
		url: `https://api-widget.soundcloud.com/${type}s/${id}${tracks ? "/tracks?limit=20" : ""}`,
		query: {
			client_id,
			// app version isnt static but lets hope soundcloud doesnt mind :) :) :)
			app_version: "1752674865",
			format: "json",
			representation: "full",
		},
	})).json as Tracks extends true ? TracksWidgetData : WidgetData;
}
async function parsePreview(transcodings: Transcoding[]) {
	const preview = transcodings.sort((a, b) => {
		const isA = a.format.protocol === "progressive";
		const isB = b.format.protocol === "progressive";

		return (isA && !isB) ? -1 : (isB && !isA) ? 1 : 0;
	})?.[0];

	if (preview?.url && preview?.duration) {
		const link = (await request({
			url: preview.url,
			query: {
				client_id,
			},
		}))
			.json as PreviewResponse;
		if (!link?.url) return;

		return {
			duration: preview.duration,
			previewUrl: link.url,
		};
	}
}

export const soundcloud: SongService = {
	name: "soundcloud",
	hosts: [
		"soundcloud.com",
		"m.soundcloud.com",
		"on.soundcloud.com",
	],
	types: ["user", "track", "playlist"],
	async parse(link, host, path) {
		if (host === "on.soundcloud.com") {
			if (!path[0] || path[1]) return null;
			const { url, status } = await request({
				url: link,
			});
			return status === 200 ? await parseLink(url) : null;
		} else {
			const [user, second, track, fourth] = path;

			let valid = false;
			if (user && !second) valid = true; // user
			else if (user && second && second !== "sets" && !track) valid = true; // playlist
			else if (user && second === "sets" && track && !fourth) valid = true; // track

			if (!valid) return null;

			const data = (await request({
				url: "https://soundcloud.com/oembed",
				query: {
					format: "json",
					url: link,
				},
			})).json as oEmbedData;
			if (!data?.html) return null;

			// https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1053322828&show_artwork=true
			const rawUrl = data.html.match(/w\.soundcloud\.com.*?url=(.*?)[&"]/)?.[1];
			if (!rawUrl) return null;

			// https://api.soundcloud.com/tracks/1053322828
			const splits = decodeURIComponent(rawUrl).split(/\/+/);
			const kind = splits[2], id = splits[3];
			if (!kind || !id) return null;

			return {
				service: this.name,
				type: kind.slice(0, -1), // turns tracks -> track
				id,
			};
		}
	},
	async render(type, id) {
		const data = await parseWidget(type, id, false);
		if (!data?.id) return null;

		const base: RenderInfoBase = {
			label: data.title ?? data.username,
			sublabel: data.user?.username ?? "Top tracks",
			explicit: Boolean(data.publisher_metadata?.explicit),
		};
		const thumbnailUrl = data.artwork_url ?? data.avatar_url;

		if (type === "track") {
			const audio = await parsePreview(data.media?.transcodings ?? []);

			return {
				...base,
				form: "single",
				thumbnailUrl,
				single: {
					audio,
					link: data.permalink_url,
				},
			};
		}

		let tracks: WidgetData[] = [];
		if (type === "user") {
			const got = await parseWidget(type, id, true);
			if (!got.collection) return null;

			tracks = got.collection;
		} else {
			if (!data.tracks) return null;

			tracks = data.tracks;
		}

		const list: RenderInfoEntryBased[] = [];
		for (const track of tracks) {
			// unavailable songs
			if (!track.title || list.length >= PLAYLIST_LIMIT) continue;

			const audio = await parsePreview(track.media?.transcodings ?? []);

			list.push({
				label: track.title,
				sublabel: track.user?.username ?? "IDKK",
				explicit: Boolean(track.publisher_metadata!.explicit),
				audio,
				link: track.permalink_url,
			});
		}

		return {
			...base,
			form: "list",
			thumbnailUrl,
			list,
		};
	},
	async validate(type, id) {
		return (await parseWidget(type, id, false))?.id !== undefined;
	},
};
