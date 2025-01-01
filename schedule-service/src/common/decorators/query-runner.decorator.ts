import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    if (!req.queryRunner) {
      throw new InternalServerErrorException(
        'If you want to use "QueryRunner" decorator, you should apply "TransactionInterceptor"',
      );
    }

    return req.QueryRunner;
  },
);
