import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../../common/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddDroneDto } from './dto/add-drone.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: RequestWithUser) {
    return this.devicesService.listUserDrones(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  add(@Req() req: RequestWithUser, @Body() dto: AddDroneDto) {
    return this.devicesService.addDrone(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.devicesService.removeDrone(req.user.sub, id);
  }

  @Get('firmware/latest')
  latestFirmware() {
    return this.devicesService.getLatestFirmware();
  }
}
