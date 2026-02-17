import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const existing = await this.usersService.findByEmail(
      dto.email.toLowerCase(),
    );
    if (existing) throw new ConflictException('Email already in use');
    const user = await this.usersService.createUser(dto);
    const token = await this.signToken(user.id, user.email, user.role);
    return { accessToken: token, user: this.usersService.toSafeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.signToken(user.id, user.email, user.role);
    return { accessToken: token, user: this.usersService.toSafeUser(user) };
  }

  private async signToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync({ sub: userId, email, role });
  }
}
