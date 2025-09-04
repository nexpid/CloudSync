import type { MaybePromise } from "bun";
import type { Song } from "structs/types";

export interface SongParser {
	name: string;
	hosts: string[];
	parse(link: string, host: string, path: string[]): MaybePromise<Song | null>;
}

export interface SongService extends SongParser {
	types: string[];
	render(type: string, id: string): MaybePromise<RenderSongInfo | null>;
	validate(type: string, id: string): MaybePromise<boolean>;
}

export interface RenderInfoBase {
	label: string;
	sublabel: string;
	explicit: boolean;
}

export interface RenderInfoEntry {
	audio?: {
		duration: number;
		previewUrl: string;
	} | undefined;
	link: string;
}
export type RenderInfoEntryBased = RenderInfoEntry & RenderInfoBase;

interface RenderSongSingle extends RenderInfoBase {
	form: "single";
	thumbnailUrl?: string;
	single: RenderInfoEntry;
}
interface RenderSongList extends RenderInfoBase {
	form: "list";
	thumbnailUrl?: string;
	list: RenderInfoEntryBased[];
}

export type RenderSongInfo = RenderSongSingle | RenderSongList;
