import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error: ApiResponse = {
      success: false,
      error:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).error || 'Error',
      message:
        typeof exceptionResponse === 'string'
          ? undefined
          : (exceptionResponse as any).message,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(error);
  }
}
