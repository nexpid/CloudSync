import type { Song } from "structs/types";

import { clean } from "./common";
import type { RenderSongInfo, SongParser, SongService } from "./helpers";

// introducing... a pointer! resolves the circular dependency
export const $ = {
	services: [] as SongService[],
	parsers: [] as SongParser[],
};

function sid(song: Song) {
	return [song.service, song.type, song.id].join(":");
}

const parseCache = new Map<string, Song | null>();
const validateCache = new Map<string, boolean>();
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
	if (song) validateCache.set(sid(song), true);
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
	if (song) validateCache.set(sid(song), true);
	return info;
}

export async function validateSong(song: Song): Promise<boolean> {
	const id = sid(song);
	if (validateCache.has(id)) return validateCache.get(id)!;

	let valid = false;
	const service = $.services.find(x => x.name === song.service);
	if (service?.types.includes(song.type)) valid = await service.validate(song.type, song.id);

	validateCache.set(id, valid);
	return valid;
}
