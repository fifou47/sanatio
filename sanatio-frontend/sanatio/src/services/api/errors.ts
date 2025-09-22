import axios, { AxiosError } from 'axios';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

const FALLBACK_MESSAGE = "Une erreur inattendue est survenue.";

function buildError(message: string, status?: number, code?: string, details?: unknown): AppError {
  const err = new Error(message || FALLBACK_MESSAGE) as AppError;
  if (status) err.status = status;
  if (code) err.code = code;
  if (typeof details !== 'undefined') err.details = details;
  return err;
}

export function toAppError(error: unknown, fallbackMessage = FALLBACK_MESSAGE): AppError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as { message?: string; error?: string; code?: string } | undefined;
    const message = typeof data?.message === 'string'
      ? data.message
      : typeof data?.error === 'string'
      ? data.error
      : fallbackMessage;
    return buildError(message, status, data?.code, data);
  }

  if (error instanceof Error) {
    const err = buildError(error.message || fallbackMessage);
    err.stack = error.stack;
    return err;
  }

  if (typeof error === 'string') {
    return buildError(error);
  }

  return buildError(fallbackMessage);
}

export function getErrorMessage(error: unknown, fallbackMessage = FALLBACK_MESSAGE): string {
  return toAppError(error, fallbackMessage).message;
}
