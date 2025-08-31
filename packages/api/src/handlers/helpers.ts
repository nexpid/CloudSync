import type { MaybePromise } from "bun";
import type { Song } from "structs/types";

import type { RenderSongInfo } from "./types";

export interface SongParser {
	hosts: string[];
	parse(link: string, host: string, path: string[]): MaybePromise<Song | null>;
}

export interface SongService extends SongParser {
	name: string;
	types: string[];
	render(type: string, id: string): MaybePromise<RenderSongInfo | null>;
	from(type: string, id: string): MaybePromise<string | null>;
}
