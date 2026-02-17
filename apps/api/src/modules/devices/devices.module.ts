import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DroneEntity } from './drone.entity';
import { FirmwareReleaseEntity } from './firmware-release.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DroneEntity, FirmwareReleaseEntity])],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
