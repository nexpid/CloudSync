import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Post,
  Put,
  Query,
  Res,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { Response } from "express";
import { DbService, UserDataSchema } from "../../lib/db/db.service";
import { UserDataDto } from "../../lib/db/user-data.dto";
import { decompressData } from "../../lib/db/conversion";

@Controller("api/data")
export class DataController {
  constructor(
    private readonly authService: AuthService,
    private readonly dbService: DbService,
  ) {}

  @Get()
  async getData(@Headers("authorization") token: string, @Res() res: Response) {
    const user = await this.authService.getUser(token);
    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");

    try {
      const data = await this.dbService.getUserData(user.userId);

      return res.header("last-modified", data?.at).json(data?.data);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.toString());
    }
  }

  @Put()
  async saveData(
    @Headers("authorization") token: string,
    @Res() res: Response,
    @Body() dataDto: UserDataDto,
  ) {
    const user = await this.authService.getUser(token);
    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");

    const { error } = UserDataSchema.validate(dataDto);
    if (error) return res.status(HttpStatus.BAD_REQUEST).send(error.toString());

    try {
      await this.dbService.saveUserData(
        user.userId,
        dataDto,
        new Date().toUTCString(),
      );
      return res.json(true);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.toString());
    }
  }

  @Delete()
  async deleteData(
    @Headers("authorization") token: string,
    @Res() res: Response,
  ) {
    const user = await this.authService.getUser(token);
    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");

    try {
      await this.dbService.deleteUserData(user.userId);
      return res.json(true);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.toString());
    }
  }

  @Get("raw")
  async downloadRaw(
    @Headers("authorization") token: string,
    /** Used as a bypass for iOs users, since RNFS is missing so the file can't be downloaded with code */
    @Query("auth") tokenBypass: string,
    @Res() res: Response,
  ) {
    const user = await this.authService.getUser(token ?? tokenBypass);
    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");

    try {
      const data = await this.dbService.retrieveUserData(user.userId);
      if (!data) return res.status(HttpStatus.NO_CONTENT).send("No data");

      const hash = Buffer.from(
        await crypto.subtle.digest("SHA-1", new TextEncoder().encode("Balls")),
      )
        .toString("hex")
        .slice(0, 8);

      res
        .header("content-type", "text/plain")
        .header(
          "content-disposition",
          `attachment; filename="CloudSync_${hash}.txt"`,
        )
        .header("last-modified", data.at)
        .send(data.data);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.toString());
    }
  }

  @Post("decompress")
  async decompressRawData(
    @Headers("authorization") token: string,
    @Res() res: Response,
    @Body() rawData: string,
  ) {
    const user = await this.authService.getUser(token);
    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");

    try {
      Buffer.from(rawData, "base64"); // make sure data is base64

      return res.json(await decompressData(rawData));
    } catch (e) {
      console.log(e);
      return res.status(HttpStatus.BAD_REQUEST).send(e.toString());
    }
  }
}
