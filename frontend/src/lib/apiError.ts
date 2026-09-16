export class AppApiError extends Error {
  status: number;
  code: string;
  fieldErrors: string[];
  requestId?: string;

  constructor(input: {
    message: string;
    status?: number;
    code?: string;
    fieldErrors?: string[];
    requestId?: string;
  }) {
    super(input.message);
    this.name = "AppApiError";
    this.status = input.status ?? 500;
    this.code = input.code ?? "INTERNAL_ERROR";
    this.fieldErrors = input.fieldErrors ?? [];
    this.requestId = input.requestId;
  }
}

export const toUserMessage = (error: unknown) => {
  if (error instanceof AppApiError) {
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 403) return "You do not have permission to do that.";
    if (error.status === 404) return "We could not find that resource.";
    if (error.status === 409) return error.message || "That already exists.";
    if (error.status === 422) return error.message || "Please check the form and try again.";
    if (error.status === 429) return "Too many attempts. Please wait and try again.";
    if (error.status >= 500) return "The server had a problem. Please try again."
    if (error.code === "NETWORK_ERROR") {
      return "Cannot reach the API. Check that the backend is running.";
    }
    return error.message;
  }
  return "Something went wrong.";
};
