import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddDroneDto } from './dto/add-drone.dto';
import { DroneEntity } from './drone.entity';
import { FirmwareReleaseEntity } from './firmware-release.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DroneEntity)
    private readonly dronesRepo: Repository<DroneEntity>,
    @InjectRepository(FirmwareReleaseEntity)
    private readonly firmwareRepo: Repository<FirmwareReleaseEntity>,
  ) {}

  listUserDrones(userId: string) {
    return this.dronesRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async addDrone(userId: string, dto: AddDroneDto) {
    const deviceCode = dto.deviceCode.trim();
    const existing = await this.dronesRepo.findOne({ where: { deviceCode } });
    if (existing) throw new ConflictException('Device code already registered');
    const drone = this.dronesRepo.create({
      ownerId: userId,
      name: dto.name.trim(),
      deviceCode,
      firmwareVersion: '',
      lastSeenAt: null,
    });
    return this.dronesRepo.save(drone);
  }

  async removeDrone(userId: string, droneId: string) {
    const drone = await this.dronesRepo.findOne({
      where: { id: droneId, ownerId: userId },
    });
    if (!drone) throw new NotFoundException('Drone not found');
    await this.dronesRepo.delete({ id: droneId });
    return { removed: true };
  }

  async getLatestFirmware() {
    return this.firmwareRepo.findOne({ order: { createdAt: 'DESC' } });
  }
}
