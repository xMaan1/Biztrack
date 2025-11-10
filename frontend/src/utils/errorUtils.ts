export function extractErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  if (!error) {
    return defaultMessage;
  }

  if (error.response) {
    return error.response.data?.detail || 
           error.response.data?.message || 
           error.response.data?.error ||
           error.message || 
           defaultMessage;
  }

  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}





