export interface ApiSuccessResponse<T> {
  code: 'OK';
  message: string;
  data: T;
  requestId: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}
