import { ICurrentUser } from '@core/types';
import { INestApplication, Logger, Injectable, UnauthorizedException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { Server, Socket } from 'socket.io';
import { RequestHandler } from 'express';
import { NotFoundException } from '@shared/execeptions';

@Injectable()
export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  private sessionMiddleware: RequestHandler;

  constructor(app: INestApplication, sessionMiddleware: RequestHandler) {
    super(app);
    this.sessionMiddleware = sessionMiddleware;
  }

  public create(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options);
    server.use((socket: Socket, next: (err: any) => void) => {
      this.sessionMiddleware(socket.request as any, {} as any, (err: any) => {
        if (err) {
          this.logger.error('Session middleware failed for socket:', err);
          return next(new UnauthorizedException('Session middleware failed'));
        }
        this.authenticateSocket(socket, next);
      });
    });

    this.logger.log(`🚀 Socket.IO server created on port ${port}`);
    return server;
  }

  private authenticateSocket(socket: Socket, next: (err?: any) => void) {
    const req = socket.request as any;

    if (!req.session) {
      this.logger.error('Session not found in socket request. Check session middleware configuration.');
      return next(new UnauthorizedException('Session not found'));
    } else if (!req.session.passport || !req.session.passport.user) {
      this.logger.error('Passport user not found in session. Ensure user is authenticated.');
      return next(new UnauthorizedException('User not authenticated'));
    } else if (!req.session.passport.user.id) {
      this.logger.error('User ID not found in session. Ensure user is properly authenticated.');
      return next(new UnauthorizedException('User ID not found'));
    }

    const user: ICurrentUser = req.session.passport.user;
    if (!user || !user.id) {
      this.logger.error('User not found in authenticated session. Re-authentication may be needed.');
      return next(new NotFoundException('User not found in session'));
    }
    socket.data.user = user;
    socket.data.userId = user.userAccountId;

    this.logger.log(`✅ User ${user.id} authenticated for Socket.IO connection.`);
    next();
  }
}
