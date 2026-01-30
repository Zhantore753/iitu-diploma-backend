import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { UserType } from 'generated/prisma';
import * as ms from 'ms';
import { Public } from 'src/public/public.decorator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/users.decorator';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import {
  AuthDto,
  CompleteRegistrationDto,
  ForgotPasswordDto,
  RegisterInitDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @User() user: any,
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
  ) {
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    await this.authService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword,
    );

    return { message: 'Пароль успешно изменен' };
  }

  // Эндпоинты восстановления пароля
  @Post('password/forgot')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return {
      message:
        'Если пользователь с таким email существует, инструкции по сбросу пароля будут отправлены',
    };
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    await this.authService.resetPassword(body.resetToken, body.newPassword);

    return { message: 'Пароль успешно изменен' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  async signIn(
    @Body() body: AuthDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const meta = { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
    const { accessToken, refreshToken } = await this.authService.signIn(
      body.email,
      body.password,
      meta,
    );

    this.setCookies(res, refreshToken);

    return res.json({ accessToken });
  }

  @Post('register/init')
  @Public()
  @HttpCode(HttpStatus.OK)
  async registerInit(@Body() body: RegisterInitDto, @Req() req: Request) {
    const meta = {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };

    const result = await this.authService.registerInit(body, meta);
    return result;
  }

  // Этап 2: Подтверждение почты OTP
  @Post('register/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(body);
    return result;
  }

  // Этап 3: Завершение регистрации (основные данные)
  @Post('register/complete')
  @Public()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiBody({
    description: 'Завершение регистрации с загрузкой аватара',
    schema: {
      type: 'object',
      required: [
        'email',
        'tempToken',
        'userType',
        'nickname',
        'phone',
        'avatar',
      ],
      properties: {
        email: { type: 'string', format: 'email' },
        tempToken: { type: 'string' },
        userType: {
          type: 'string',
          enum: Object.values(UserType),
        },
        nickname: { type: 'string' },
        phone: { type: 'string' },
        bio: { type: 'string', nullable: true },
        avatar: {
          type: 'string',
          format: 'binary', // 🔥 ВАЖНО
        },
      },
    },
  })
  
  async completeRegistration(
    @UploadedFile() avatar: Express.Multer.File,
    @Body() body: CompleteRegistrationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!avatar) {
      throw new BadRequestException('Avatar is required');
    }

    const meta = {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };

    const { accessToken, refreshToken, user } =
      await this.authService.completeRegistration(body, avatar, meta);

    this.setCookies(res, refreshToken);

    const { password, ...userWithoutPassword } = user;

    return res.status(HttpStatus.CREATED).json({
      accessToken,
      user: userWithoutPassword,
    });
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  async refresh(@Req() req: Request, @User() user: any, @Res() res: Response) {
    const meta = { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(user, meta);

    this.setCookies(res, newRefreshToken);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    const cookieName =
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') ??
      'refresh_token';
    const rawRefreshToken = req.cookies?.[cookieName];
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    // clear cookie
    res.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@User() user: any) {
    if (!user.sub) throw new BadRequestException('userId required');
    await this.authService.logoutAll(user.sub);
    return { ok: true };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @Public()
  async signUp(
    @Body() body: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const meta = {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
    const { accessToken, refreshToken } = await this.authService.signUp(
      body,
      meta,
    );

    // Убедись, что refreshToken есть
    if (!refreshToken)
      throw new InternalServerErrorException('No refresh token generated');

    this.setCookies(res, refreshToken);

    res.status(HttpStatus.CREATED).json({ accessToken });
  }

  private setCookies(res: Response, refreshToken: string) {
    const cookieName =
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') ??
      'refresh_token';
    const isProd = this.configService.get('NODE_ENV') === 'production';
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: ms(
        this.configService.get('JWT_REFRESH_SECRET_EXP') as ms.StringValue,
      ),
    });
  }

  @Roles([UserType.admin])
  @Get()
  findAll() {
    return [];
  }
}
