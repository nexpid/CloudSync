import { Module } from "@nestjs/common";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { DataController } from "./data/data.controller";
import { DbService } from "../lib/db/db.service";
import { ConfigModule } from "@nestjs/config";
import { SillyController } from "./silly/silly.controller";
import { SillyService } from "./silly/silly.service";

@Module({
  imports: [ConfigModule],
  controllers: [AuthController, DataController, SillyController],
  providers: [AuthService, DbService, SillyService],
})
export class ApiModule {}
