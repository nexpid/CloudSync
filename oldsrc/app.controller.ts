import { Controller, Get, Redirect } from "@nestjs/common";

@Controller()
export class AppController {
  @Redirect("https://github.com/nexpid/CloudSync", 301)
  @Get()
  redirectToGitHub(): void {}
}
