import { IsString, MinLength } from 'class-validator';

export class AddDroneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(6)
  deviceCode!: string;
}
