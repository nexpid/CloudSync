import { z } from "zod";

import { logger } from "../logger";
import { compressData, decompressData } from "./conversion";

export const UserDataSchema = z.object({
	plugins: z.record(
		z.url(),
		z.object({
			enabled: z.boolean(),
			storage: z
				.custom<string | undefined>((data) => {
					if (typeof data !== "string") return false;
					try {
						JSON.parse(data);
						return true;
					} catch {
						return false;
					}
				}, "Plugin storage must be valid JSON")
				.optional(),
		}),
	),
	themes: z.record(
		z.url(),
		z.object({
			enabled: z.boolean(),
		}),
	),
	fonts: z.object({
		installed: z.record(
			z.url(),
			z.object({
				enabled: z.boolean(),
			}),
		),
		custom: z.array(z.record(z.string(), z.any())),
	}),
});
export type UserData = z.infer<typeof UserDataSchema>;

export type ApiUserData = {
	data: UserData;
	at: string;
};

interface v1UserData {
	themes: {
		id: string;
		enabled: boolean;
	}[];
	plugins: {
		id: string;
		enabled: boolean;
		options: object;
	}[];
}

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
	data: string | UserData,
	at: string,
) {
	return await sql(
		"insert or replace into data (user, version, sync, at) values (?, ?, ?, ?)",
		[
			userId,
			"2",
			typeof data === "string" ? data : await compressData(data),
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
			data: { plugins: {}, themes: {}, fonts: { installed: {}, custom: [] } },
			at: new Date().toISOString(),
		};
	}

	const decomp = await decompressData(data.data);
	return {
		data: decomp,
		at: data.at,
	};
}

export async function retrieveUserData(
	userId: string,
): Promise<{ data: string; at: string } | null> {
	const data = await sql("select * from data where user = ?", [userId]).first<
		{
			user: string;
			version: number;
			sync: string;
			at: string | null;
		}
	>();
	if (!data) return null;

	if (data.version === 1) {
		try {
			const oldData = JSON.parse(data.sync) as v1UserData;
			const newData = await compressData({
				plugins: Object.fromEntries(
					oldData.plugins.map((p) => [
						p.id,
						{
							enabled: p.enabled,
							storage: JSON.stringify(p.options),
						},
					]),
				),
				themes: Object.fromEntries(
					oldData.themes.map((t) => [t.id, { enabled: t.enabled }]),
				),
				fonts: {
					installed: {},
					custom: [],
				},
			});

			const at = new Date().toISOString();
			void saveUserData(userId, newData, at);
			return { data: newData, at };
		} catch (e) {
			logger.error("Data migration v2 failed", { userId, error: e });
			throw new Error(`Failed to migrate your data to v2: ${String(e)}`);
		}
	} else return { data: data.sync, at: data.at ?? new Date().toISOString() };
}
