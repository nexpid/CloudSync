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
