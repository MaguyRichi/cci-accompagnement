import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDirigeantDto } from "./dto/register-dirigeant.dto";
import { RegisterMentorDto } from "./dto/register-mentor.dto";
import { LoginDto } from "./dto/login.dto";
import { ActivateDto } from "./dto/activate.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ---------- INSCRIPTIONS ---------- */

  @Post("register-dirigeant")
  @HttpCode(HttpStatus.CREATED)
  registerDirigeant(@Body() dto: RegisterDirigeantDto) {
    return this.authService.registerDirigeant(dto);
  }

  @Post("register-mentor")
  @HttpCode(HttpStatus.CREATED)
  registerMentor(@Body() dto: RegisterMentorDto) {
    return this.authService.registerMentor(dto);
  }

  /* ---------- CONNEXION ---------- */

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /* ---------- VÉRIFICATION DU TOKEN D'ACTIVATION ---------- */

  @Get("verify-token")
  @HttpCode(HttpStatus.OK)
  verifyToken(@Query("token") token: string) {
    return this.authService.verifyActivationToken(token);
  }

  /* ---------- ACTIVATION ---------- */

  @Post("activate")
  @HttpCode(HttpStatus.OK)
  activate(@Body() dto: ActivateDto) {
    return this.authService.activate(dto);
  }

  /* ---------- RENVOYER L'EMAIL D'ACTIVATION (ADMIN) ---------- */

  @Post("envoyer-activation/:userId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  envoyerActivation(@Param("userId", ParseIntPipe) userId: number) {
    return this.authService.envoyerEmailActivation(userId);
  }

  /* ---------- MOT DE PASSE OUBLIÉ ---------- */

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /* ---------- PROFIL ---------- */

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser("id") userId: number) {
    return this.authService.getMe(userId);
  }
}