import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MSConfig } from './microservice.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
     useFactory: (configService: ConfigService) => {
  const uri = configService.get<string>('rmq.uri');

  console.log("RabbitMQ URI:", uri); // debug

  return {
    exchanges: [{ ...MSConfig.exchanges.business }],
    queues: [
      { ...MSConfig.queues.idea },
      { ...MSConfig.queues.marketResearch },
      { ...MSConfig.queues.marketFit },
      { ...MSConfig.queues.prototype },
      { ...MSConfig.queues.problemStatement },
      { ...MSConfig.queues.studentPitchScript },
      { ...MSConfig.queues.studentPitchFeedback },
    ],

    // 🔥 THIS IS THE MAIN FIX
    uri: uri && uri.includes('@')
      ? uri
      : 'amqp://guest:guest@127.0.0.1:5672',

    connectionManagerOptions: {
      heartbeatIntervalInSeconds: 1800,
    },
    connectionInitOptions: { wait: true },
//    connectionInitOptions: { reject: false, wait: false },
  };
}
    }),
  ],
  exports: [RabbitMQModule],
})
export class MicroserviceModule {}
