import { z } from "zod";

import { latestDataVersion, migrateUserData, RawSQLUserData } from "./migration";

// song types
const SpotifySong = z.object({
	service: z.literal("spotify"),
	type: z.union([
		z.literal("track"),
		z.literal("album"),
		z.literal("playlist"),
		z.literal("artist"),
	]),
	id: z.string(),
});
export type SpotifySong = z.infer<typeof SpotifySong>;

const SoundcloudSong = z.object({
	service: z.literal("soundcloud"),
	type: z.union([z.literal("user"), z.literal("track"), z.literal("playlist")]),
	id: z.string(),
});
export type SoundcloudSong = z.infer<typeof SoundcloudSong>;

const AppleMusicSong = z.object({
	service: z.literal("applemusic"),
	type: z.union([
		z.literal("artist"),
		z.literal("song"),
		z.literal("album"),
		z.literal("playlist"),
	]),
	id: z.string(),
});
export type AppleMusicSong = z.infer<typeof AppleMusicSong>;

const Song = z.union([SpotifySong, SoundcloudSong, AppleMusicSong]);
export type Song = z.infer<typeof Song>;

// api types

export const UserDataSchema = z.array(Song).max(6);
export type UserData = Song[];

export type ApiUserData = {
	data: UserData;
	at: string;
};

let env: Env;
export function assignEnv(_env: Env) {
	env = _env;
}

export function sql(
	query: string,
	params: string[],
) {
	return env.DB.prepare(query).bind(...params);
}

export async function saveUserData(
	userId: string,
	data: UserData,
	at: string,
) {
	return await sql(
		"insert or replace into data (user, version, songs, at) values (?, ?, ?, ?)",
		[
			userId,
			String(latestDataVersion),
			JSON.stringify(data),
			at,
		],
	).run();
}

export async function deleteUserData(userId: string) {
	return await sql("delete from data where user = ?", [userId]).run();
}

export async function getUserData(userId: string): Promise<ApiUserData> {
	const data = await retrieveUserData(userId);
	if (!data) {
		return {
			data: [],
			at: new Date().toISOString(),
		};
	}

	return {
		data: JSON.parse(data.data) as UserData,
		at: data.at,
	};
}

export async function retrieveUserData(
	userId: string,
): Promise<{ data: string; at: string } | null> {
	const data = await sql("select * from data where user = ?", [userId]).first<RawSQLUserData>();
	if (!data) return null;

	return migrateUserData(data, saveUserData);
}
