import { registerAs } from '@nestjs/config';

export const awsConfig = registerAs('rabbitmq', () => {
  return {
    region: process.env.AWS_REGION!,
    
     problemStatement: {
        exchange: process.env.PROBLEM_STATEMENT_EXCHANGE!,
        queue: process.env.PROBLEM_STATEMENT_QUEUE!,
        routingKey: process.env.PROBLEM_STATEMENT_ROUTING_KEY,
    },
    //  problem_statement: {

    //     'queue_name': 'problem_statement.req.queue',
    //     'routing_key': 'problem_statement.req',
    //     'folder_path': 'problem_statement',
    //     'consumer_class': 'ProblemStatementTipsConsumer'
    // },

  };
});
