import type { Request } from 'express';

export type AuthUser = {
  sub: string;
  email: string;
  role: string;
};

export type RequestWithUser = Request & {
  user: AuthUser;
};
