/**
 * Utility to extract a clean, human-readable error message from API error responses.
 * Prevents React runtime error "Objects are not valid as a React child" when Pydantic / FastAPI
 * returns validation error objects/arrays like [{ type, loc, msg, input, ctx }].
 */
export function formatApiError(err: any, fallbackMessage: string = 'An unexpected error occurred. Please try again.'): string {
  if (!err) return fallbackMessage;

  const detail = err.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    // Array of Pydantic validation error objects
    const messages = detail.map((d: any) => {
      if (typeof d === 'string') return d;
      if (d && typeof d === 'object') {
        const fieldName = Array.isArray(d.loc) ? d.loc.filter((part: any) => part !== 'body').join(' -> ') : '';
        const rawMsg = d.msg || 'Invalid value';
        return fieldName ? `${fieldName}: ${rawMsg}` : rawMsg;
      }
      return String(d);
    });
    return messages.filter(Boolean).join(' | ') || fallbackMessage;
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return fallbackMessage;
}
