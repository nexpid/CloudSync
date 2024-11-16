import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ConfigModule } from "@nestjs/config";
import { ApiModule } from "./api/api.module";

@Module({
  imports: [ConfigModule.forRoot(), ApiModule],
  controllers: [AppController],
})
export class AppModule {}
