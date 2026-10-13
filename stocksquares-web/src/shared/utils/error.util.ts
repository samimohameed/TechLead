import { ErrorCode } from '../dtos';

export interface FormattedError {
  message: string;
  errorCode?: ErrorCode;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Extracts unified error information from API failures, validation errors, or network issues.
 * Direct implementation of the Blocks ErrorService standard.
 */
export function extractErrorMessage(error: any): FormattedError {
  if (!error) {
    return { message: 'An unknown error occurred.' };
  }

  let message = error.message || 'Operation failed.';
  const errorCode = error.errorCode as ErrorCode | undefined;
  const fieldErrors = error.errors as Record<string, string[]> | undefined;

  // Extract nested validation errors if present
  if (fieldErrors && typeof fieldErrors === 'object') {
    const errorDetails: string[] = [];
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (Array.isArray(value)) {
        errorDetails.push(`${key}: ${value.join(', ')}`);
      } else if (typeof value === 'string') {
        errorDetails.push(`${key}: ${value}`);
      }
    }
    if (errorDetails.length > 0) {
      message = errorDetails.join(' | ');
    }
  }

  // Handle network / status code fallbacks
  if (error.status === 0 || error.message?.includes('Failed to fetch')) {
    message = 'Unable to connect to trading backend. Please verify that the API server is running.';
  } else if (error.status === 404) {
    message = 'Requested resource or order was not found.';
  } else if (error.status === 409) {
    message = 'Order submission conflict or duplicate idempotency key detected.';
  } else if (error.status === 500) {
    message = 'Internal trading server error. Please try again.';
  }

  return {
    message,
    errorCode,
    fieldErrors
  };
}
