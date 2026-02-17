import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DevicesModule } from './modules/devices/devices.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
        const isProd = nodeEnv === 'production';

        if (nodeEnv === 'test') {
          return {
            type: 'sqljs',
            autoSave: false,
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        const sync =
          config.get<string>('DB_SYNC') === 'true' ||
          (!isProd && config.get<string>('DB_SYNC') !== 'false');

        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: sync,
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun: config.get<string>('DB_RUN_MIGRATIONS') === 'true',
          ssl:
            config.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : undefined,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    DevicesModule,
    TelemetryModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
