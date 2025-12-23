export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ResponseDto<T = any> implements ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;

  constructor(data?: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static error(error: string, message?: string): ApiResponse {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static ok<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
