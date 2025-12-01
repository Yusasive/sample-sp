export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const err = error as { error_description?: string; message?: string; [key: string]: unknown };
    if (typeof err.error_description === "string") {
      return err.error_description;
    }
    if (typeof err.message === "string") {
      return err.message;
    }
  }
  return "An unexpected error occurred";
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
