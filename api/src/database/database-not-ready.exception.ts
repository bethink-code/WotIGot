import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseNotReadyException extends HttpException {
  constructor(message: string = 'Database is not ready') {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message,
        error: 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
