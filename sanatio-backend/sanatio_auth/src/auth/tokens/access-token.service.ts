import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccessTokenService {
  constructor(private jwtService: JwtService) {}

  generateToken(user: any, sessionId?: string) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId,
    });
  }
}
