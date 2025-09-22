import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    sub?: string;
    userId?: string;
    email: string;
    roles: string[];
    sessionId?: string;
  };
}
