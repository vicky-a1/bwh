import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { RequestWithUser } from '../../common/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) return { user: null };
    return { user: this.usersService.toSafeUser(user) };
  }
}
