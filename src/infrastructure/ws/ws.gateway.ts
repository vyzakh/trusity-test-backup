import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from './ws-auth.guard';
import { ICurrentUser } from '@core/types';

@WebSocketGateway({ cors: '*', transports: ['websocket', 'polling'] })
export class WSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // private studentSocketMap = new Map<string, string>();

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const user = client.data;
    const userId = user.user.userAccountId;
    if (userId) {
      client.data.userId = userId;
      console.log(`✅ Client connected: socketId=${client.id}, userId=${userId}`);
    } else {
      console.log(`⚠️ Client connected without userId: socketId=${client.id}`);
    }
    // if (studentId) {
    //   this.studentSocketMap.set(studentId, client.id);
    //   console.log(`✅ Student ${studentId} connected with socket ${client.id}`);
    // }

    console.log('✅ Client connected:', client.id, client.data.userId);

    client.emit('connection-success', {
      message: 'Connected successfully!',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected:', client.id);

    // for (const [studentId, socketId] of this.studentSocketMap.entries()) {
    //   if (socketId === client.id) {
    //     this.studentSocketMap.delete(studentId);
    //     console.log(`Student ${studentId} disconnected`);
    //     break;
    //   }
    // }
  }

  @SubscribeMessage('test')
  @UseGuards(WsAuthGuard)
  handleTestMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('📨 Received test message:', data);
    this.server.emit('test-response', {
      message: 'Test message received!',
      originalData: data,
      timestamp: new Date().toISOString(),
    });
  }

  sendMessage(recipients: Array<{ id: string; reFetchNotification: Boolean }>, from?: string) {
    recipients.forEach((recipient) => {
      const studentSocket = [...this.server.sockets.sockets.values()].find((s) => s.data.userId === recipient.id);
      if (studentSocket) {
        studentSocket.emit('notification', {
          from: from ?? 'system',
          message: recipient.reFetchNotification,
          timestamp: new Date().toISOString(),
        });
      } else {
        this.server.to(recipient.id).emit('notification', {
          from: from ?? 'system',
          message: recipient.reFetchNotification,
          timestamp: new Date().toISOString(),
        });
      }
      // const StudentsocketId = this.studentSocketMap.get(recipientId);
      // if (StudentsocketId) {
      // this.server.to(StudentsocketId ?? recipientId).emit('newMessage', {
      //   from: from ?? 'system',
      //   message,
      //   timestamp: new Date().toISOString(),
      // });
      // } else {
      //   this.server.to(recipientId).emit('newMessage', {
      //     from: from ?? 'system',
      //     message,
      //     timestamp: new Date().toISOString(),
      //   });
      // }
    });
  }

  //...............................................................
  // sendMessage(recipientIds: string[], message: string, from?: string): void {
  //   if (!recipientIds || recipientIds.length === 0) {
  //     new NotFoundException('sendMessage: No recipient IDs provided');
  //   }
  //   if (!message || message.trim() === '') {
  //     new NotFoundException('sendMessage: Empty message provided');
  //   }
  //   const connectedSockets = [...this.server.sockets.sockets.values()];
  //   recipientIds = ['163'];
  //   recipientIds.forEach((recipientId) => {
  //     try {
  //       console.log('Processing recipient ID:', recipientId);

  //       const studentSocket = connectedSockets.find((socket) => socket.data?.userId === recipientId);
  //       if (studentSocket) {
  //         console.log(`Found connected socket for student ${recipientId}`);
  //         studentSocket.emit('newMessage');
  //       } else {
  //         console.log(`No direct socket found for student ${recipientId}, trying room-based delivery`);
  //         this.server.to(recipientId).emit('newMessage');
  //       }
  //     } catch (error) {
  //       console.error(`Error sending message to recipient ${recipientId}:`, error);
  //     }
  //   });
  //   console.log('Message sending completed');
  // }

  // async sendMessageAsync(recipientIds: string[], message: string, from?: string): Promise<void> {
  //   if (!recipientIds || recipientIds.length === 0) {
  //     throw new Error('No recipient IDs provided');
  //   }

  //   if (!message || message.trim() === '') {
  //     throw new Error('Empty message provided');
  //   }

  //   const messagePayload = {
  //     from: from ?? 'system',
  //     message: message.trim(),
  //     timestamp: new Date().toISOString(),
  //   };

  //   console.log('Sending message to recipients:', recipientIds);

  //   const connectedSockets = [...this.server.sockets.sockets.values()];
  //   const deliveryPromises: Promise<void>[] = [];

  //   recipientIds.forEach((recipientId) => {
  //     const deliveryPromise = new Promise<void>((resolve, reject) => {
  //       try {
  //         const studentSocket = connectedSockets.find((socket) => socket.data?.studentId === recipientId);

  //         if (studentSocket) {
  //           studentSocket.emit('newMessage', messagePayload, (ack: any) => {
  //             if (ack?.error) {
  //               reject(new Error(`Failed to deliver to ${recipientId}: ${ack.error}`));
  //             } else {
  //               console.log(`Message delivered to student ${recipientId}`);
  //               resolve();
  //             }
  //           });
  //         } else {
  //           this.server.to(recipientId).emit('newMessage', messagePayload);
  //           resolve();
  //         }
  //       } catch (error) {
  //         reject(error);
  //       }
  //     });

  //     deliveryPromises.push(deliveryPromise);
  //   });

  //   try {
  //     await Promise.allSettled(deliveryPromises);
  //     console.log('Message sending completed');
  //   } catch (error) {
  //     console.error('Some messages failed to send:', error);
  //   }
  // }
}
