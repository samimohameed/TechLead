import { ErrorCode } from '../enums/error-code.enum';

export interface Result<T> {
  isSuccess: boolean;
  message: string;
  errorCode?: ErrorCode | string;
  data: T;
  errors?: Record<string, string[]>;
}
