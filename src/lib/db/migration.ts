import { logger } from "lib/logger";

import { saveUserData } from ".";
import { compressData, latestDataVersion } from "./conversion";

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

export interface RawSQLUserData {
	user: string;
	version: 1 | 2;
	sync: string;
	at: string | null;
}
export interface SQLUserData {
	data: string;
	at: string;
}

export async function migrateUserData(
	data: RawSQLUserData,
	onMigrate: typeof saveUserData,
): Promise<SQLUserData> {
	if (data.version === latestDataVersion) {
		return {
			data: data.sync,
			at: data.at,
		};
	} else if (data.version === 1) {
		try {
			const oldData = JSON.parse(data.sync) as v1UserData;
			const newData = await compressData({
				plugins: Object.fromEntries(
					oldData.plugins.map(({ id, enabled, options }) => [
						id,
						{
							enabled,
							storage: JSON.stringify(options),
						},
					]),
				),
				themes: Object.fromEntries(
					oldData.themes.map(({ id, enabled }) => [id, { enabled }]),
				),
				fonts: {
					installed: {},
					custom: [],
				},
			});

			const at = new Date().toISOString();
			void onMigrate(data.user, newData, at);

			return {
				data: newData,
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
			sync: data.sync.slice(0, 20),
			at: data.at,
		});
		throw new Error("Your save data (somehow) uses an unknown version. Please try again later");
	}
}
