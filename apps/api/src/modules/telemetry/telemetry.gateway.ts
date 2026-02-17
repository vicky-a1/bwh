import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type JwtPayload = { sub: string; email: string; role: string };

type DroneTelemetry = {
  ts: number;
  droneId: string;
  altitudeM?: number;
  batteryPct?: number;
  lat?: number;
  lon?: number;
  yawDeg?: number;
};

@Injectable()
@WebSocketGateway({
  namespace: '/telemetry',
  cors: { origin: true, credentials: true },
})
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server;

  private readonly lastByDrone = new Map<string, DroneTelemetry>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private extractToken(client: Socket) {
    const authUnknown: unknown = client.handshake.auth;
    if (authUnknown && typeof authUnknown === 'object') {
      const token = (authUnknown as { token?: unknown }).token;
      if (typeof token === 'string' && token.length > 0) return token;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string') {
      return header.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    const secret = this.config.get<string>('JWT_SECRET');
    if (!token || !secret) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
      const data = client.data as { user?: JwtPayload };
      data.user = payload;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('telemetry:subscribe')
  onSubscribe(
    @MessageBody() body: { droneId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const droneId = body?.droneId;
    if (!droneId) return { ok: false };
    void client.join(`drone:${droneId}`);
    const last = this.lastByDrone.get(droneId);
    return { ok: true, last };
  }

  @SubscribeMessage('telemetry:publish')
  onPublish(@MessageBody() body: DroneTelemetry) {
    const droneId = body?.droneId;
    if (!droneId) return { ok: false };
    const msg: DroneTelemetry = { ...body, ts: body.ts ?? Date.now() };
    this.lastByDrone.set(droneId, msg);
    this.server.to(`drone:${droneId}`).emit('telemetry:update', msg);
    return { ok: true };
  }

  @SubscribeMessage('drone:command')
  onCommand(
    @MessageBody() body: { droneId: string; command: string; args?: unknown },
  ) {
    if (!body?.droneId || !body?.command) return { ok: false };
    this.server.to(`drone:${body.droneId}`).emit('drone:command', {
      command: body.command,
      args: body.args ?? null,
      ts: Date.now(),
    });
    return { ok: true };
  }
}
