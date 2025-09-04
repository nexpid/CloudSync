import { UserData } from "@song-spotlight/api/structs";
import { logger } from "lib/logger";

import { saveUserData } from ".";

export const latestDataVersion = 2;

type v1UserData = ({
	service: string;
	type: string;
	id: string;
} | null)[];

export interface RawSQLUserData {
	user: string;
	version: 1 | 2;
	songs: string;
	at: string | null;
}
export interface SQLUserData {
	data: string;
	at: string;
}

export function migrateUserData(
	data: RawSQLUserData,
	onMigrate: typeof saveUserData,
): SQLUserData {
	if (data.version === latestDataVersion) {
		return {
			data: data.songs,
			at: data.at,
		};
	} else if (data.version === 1) {
		try {
			const oldData = JSON.parse(data.songs) as v1UserData;
			const newData = oldData.filter((x) => x !== null).slice(0, 6) as UserData;

			const at = new Date().toISOString();
			void onMigrate?.(data.user, newData, at);

			return {
				data: JSON.stringify(newData),
				at,
			};
		} catch (error) {
			logger.error(`Data migration from v1 to v${latestDataVersion}`, {
				userId: data.user,
				error,
			});
			throw new Error(`Failed to migrate your data to v2: ${String(error)}`);
		}
	} else {
		logger.error("Unkown data version", {
			userId: data.user,
			version: data.version,
			sync: data.songs.slice(0, 20),
			at: data.at,
		});
		throw new Error("Your save data (somehow) uses an unknown version. Please try again later");
	}
}
