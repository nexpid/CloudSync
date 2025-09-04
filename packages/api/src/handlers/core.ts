import { songdotlink } from "./defs/parsers/songdotlink";
import { applemusic } from "./defs/services/applemusic";
import { soundcloud } from "./defs/services/soundcloud";
import { spotify } from "./defs/services/spotify";
import { $ } from "./finders";
import type { SongParser, SongService } from "./helpers";

export const services = [
	spotify,
	soundcloud,
	applemusic,
] as SongService[];
$.services = services;

export const parsers = [
	songdotlink,
	...services,
] as SongParser[];
$.parsers = parsers;
