import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SignJWT, jwtVerify } from "jose";

interface User {
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  private key() {
    return new TextEncoder().encode(this.configService.get("JWT_SECRET"));
  }

  async getUser(auth: string): Promise<User | null> {
    if (!auth) return null;
    try {
      return (await jwtVerify<User>(auth, this.key())).payload;
    } catch {
      return null;
    }
  }

  async createToken(id: string): Promise<string> {
    return await new SignJWT({
      userId: id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(this.key());
  }
}
