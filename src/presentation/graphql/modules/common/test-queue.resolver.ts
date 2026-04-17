import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class TestQueueResolver {
  constructor(
    @Inject(AmqpConnection) private readonly amqpConnection: AmqpConnection,
  ) {}

  @Query(() => String)
  async sendTestMessage(): Promise<string> {
    try {
      const data = await this.amqpConnection.request({
        exchange: 'market.exchange',
        routingKey: 'market.research',
        timeout: 60000,
        payload: {
          targetMarket: 'ddqwdwqdqwdqw',
          marketResearch: 'dqwdwqdqw',
          class: '10',
        },
      });
      console.log(data);
      console.log('Response from RabbitMQ:', data);
      return `Success! Response: ${JSON.stringify(data)}`;
    } catch (error) {
      console.log(error);
      return 'Failed to send message.';
    }
    return 'message sented';
  }

  // @Query(() => String)
  // async sendTestMessage(): Promise<string> {
  //   await this.amqpConnection.publish(
  //     'idea.exchange',
  //     'test.route',
  //     {
  //       message,
  //       timestamp: new Date().toISOString(),
  //     },
  //   );
  //   return `Message sent to RabbitMQ: ${message}`;
  // }
}
