import { Controller, Post, Body, UseGuards, Req, Get, Delete, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/express-request.interface';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { SessionService } from './session.service';
import { UserService } from '../user/user.service';
import { SetAutoLockDto } from './dto/set-auto-lock.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 201, description: 'Connexion réussie. Retourne les tokens.' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  login(@Body() loginDto: LoginDto, @Req() req: AuthenticatedRequest) {
    const userAgent = req.headers['user-agent'] || null;
    const ipHeader = req.headers['x-forwarded-for'] as string | undefined;
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : req.ip || null;
    return this.authService.login(loginDto, { userAgent, ip });
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Rafraîchir le token JWT' })
  @ApiResponse({ status: 200, description: 'Nouveau token généré avec succès' })
  @ApiResponse({ status: 401, description: 'Token de rafraîchissement invalide' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Si un compte existe, un code de réinitialisation est envoyé' })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    await this.passwordResetService.requestReset(dto.emailOrPhone.trim());
    return { message: 'If the account exists, a reset token has been sent' };
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirmer la réinitialisation de mot de passe avec le code reçu' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    await this.passwordResetService.confirmReset(dto.token.trim(), dto.newPassword);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  logout(@Req() req: AuthenticatedRequest) {
    const payload = req.user as any;
    const userId = payload.userId ?? payload.sub;
    const sessionId = payload.sessionId ?? null;
    return this.authService.logout(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les sessions actives de l’utilisateur' })
  async listSessions(@Req() req: AuthenticatedRequest) {
    const payload = req.user as any;
    const userId = payload.userId ?? payload.sub;
    const currentSessionId = payload.sessionId ?? null;
    const sessions = await this.sessionService.list(userId);
    const user = await this.userService.findById(userId);
    return {
      autoLockEnabled: user.autoLockEnabled ?? false,
      sessions: sessions.map((session) => ({
        ...session,
        isCurrent: session.sessionId === currentSessionId,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminer une session active' })
  @ApiResponse({ status: 200, description: 'Session terminée' })
  async deleteSession(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const payload = req.user as any;
    const userId = payload.userId ?? payload.sub;
    const currentSessionId = payload.sessionId ?? null;
    await this.authService.logout(userId, sessionId);
    return {
      message: sessionId === currentSessionId ? 'Current session terminated' : 'Session terminated',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/lock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer ou désactiver le verrouillage automatique des sessions' })
  async setAutoLock(@Req() req: AuthenticatedRequest, @Body() dto: SetAutoLockDto) {
    const payload = req.user as any;
    const userId = payload.userId ?? payload.sub;
    await this.userService.setAutoLock(userId, dto.enabled);
    return { autoLockEnabled: dto.enabled };
  }
}
