import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import { compressData, decompressData } from "./conversion";
import { UserDataDto } from "./user-data.dto";
import Cloudflare from "cloudflare";

export type UserData = (typeof UserDataDto)["prototype"];
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

export const UserDataSchema = Joi.object({
  plugins: Joi.object()
    .pattern(
      Joi.string().uri(),
      Joi.object({
        enabled: Joi.boolean(),
        storage: Joi.string().custom((value, helpers) => {
          try {
            JSON.parse(value);
          } catch {
            return helpers.error("Plugin storage must be valid JSON");
          }
          return true;
        }),
      }),
    )
    .required(),
  themes: Joi.object()
    .pattern(
      Joi.string().uri(),
      Joi.object({
        enabled: Joi.boolean(),
      }),
    )
    .required(),
  fonts: Joi.object({
    installed: Joi.object()
      .pattern(
        Joi.string().uri(),
        Joi.object({
          enabled: Joi.boolean(),
        }),
      )
      .required(),
    custom: Joi.array().items(Joi.object()).required(),
  }).required(),
});

@Injectable()
export class DbService {
  constructor(private configService: ConfigService) {}

  async sql<DataStructure>(
    query: string,
    params: string[],
  ): Promise<DataStructure> {
    const { apiToken, dbId, account_id } = {
      apiToken: this.configService.get<string>("CLOUDFLARE_D1_BEARER_TOKEN"),
      dbId: this.configService.get<string>("CLOUDFLARE_D1_DATABASE_ID"),
      account_id: this.configService.get<string>("CLOUDFLARE_ACCOUNT_ID"),
    };

    return (
      await new Cloudflare({
        apiToken,
      }).d1.database.query(dbId, { account_id, sql: query, params })
    )[0].results[0] as any;
  }

  async saveUserData(userId: string, data: string | UserData, at: string) {
    await this.sql(
      "insert or replace into data (user, version, sync, at) values (?, ?, ?, ?)",
      [
        userId,
        "2",
        typeof data === "string" ? data : await compressData(data),
        at,
      ],
    );
  }

  async deleteUserData(userId: string) {
    await this.sql("delete from data where user = ?", [userId]);
  }

  async getUserData(userId: string): Promise<ApiUserData> {
    const data = await this.retrieveUserData(userId);
    if (!data)
      return {
        data: { plugins: {}, themes: {}, fonts: { installed: {}, custom: [] } },
        at: null,
      };

    const decomp = await decompressData(data.data);
    return {
      data: decomp,
      at: data.at,
    };
  }

  async retrieveUserData(
    userId: string,
  ): Promise<{ data: string; at: string } | null> {
    const data = await this.sql<{
      user: string;
      version: number;
      sync: string;
      at: string | null;
    } | null>("select * from data where user = ?", [userId]);
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

        const at = new Date().toUTCString();
        this.saveUserData(userId, newData, at);
        return { data: newData, at };
      } catch (e) {
        throw new Error(`Failed to migrate your data to v2: ${e.message}`);
      }
    } else return { data: data.sync, at: data.at ?? new Date().toUTCString() };
  }
}
