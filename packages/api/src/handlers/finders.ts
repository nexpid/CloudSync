import type { Song } from "structs/types";

import { clean } from "./common";
import type { SongParser, SongService } from "./helpers";
import type { RenderSongInfo } from "./types";

// introducing... a pointer! resolves the circular dependency
export const $ = {
	services: [] as SongService[],
	parsers: [] as SongParser[],
};

function sid(song: Song) {
	return [song.service, song.type, song.id].join(":");
}

const parseCache = new Map<string, Song | null>();
const linkCache = new Map<string, string | null>();
export async function parseLink(link: string): Promise<Song | null> {
	const cleaned = clean(link);
	if (parseCache.has(cleaned)) return parseCache.get(cleaned)!;

	const { hostname, pathname } = new URL(cleaned);
	const path = pathname.slice(1).split(/\/+/);

	let song: Song | null = null;
	for (const parser of $.parsers) {
		if (parser.hosts.includes(hostname)) {
			song = await parser.parse(cleaned, hostname, path);
			if (song) break;
		}
	}

	parseCache.set(cleaned, song);
	if (song) linkCache.set(sid(song), cleaned);
	return song;
}

const renderCache = new Map<string, RenderSongInfo | null>();
export async function renderSong(song: Song): Promise<RenderSongInfo | null> {
	const id = sid(song);
	if (renderCache.has(id)) return renderCache.get(id)!;

	let info: RenderSongInfo | null = null;
	const service = $.services.find(x => x.name === song.service);
	if (service?.types.includes(song.type)) info = await service.render(song.type, song.id);

	renderCache.set(id, info);
	return info;
}

export async function toLink(song: Song): Promise<string | null> {
	const id = sid(song);
	if (linkCache.has(id)) return linkCache.get(id)!;

	let link: string | null = null;
	const service = $.services.find(x => x.name === song.service);
	if (service?.types.includes(song.type)) link = await service.from(song.type, song.id);

	const cleaned = link ? clean(link) : link;

	linkCache.set(id, cleaned);
	if (cleaned) {
		parseCache.set(cleaned, {
			service: song.service,
			type: song.type,
			id: song.id,
		});
	}
	return link;
}
