import type { User } from './user';

export type ApiCallLog = {
  id: number;
  userId: number | null;
  userName: string | null;
  method: string;
  route: string;
  functionName: string;
  statusCode: number;
  calledAt: string;
};

export type AuthEventLog = {
  id: number;
  userId: number | null;
  userName: string | null;
  eventType: string;
  sourcePath: string;
  details: string | null;
  createdAt: string;
};

export type UserDetailsResponse = {
  user: User;
  apiLogs: ApiCallLog[];
  authLogs: AuthEventLog[];
};
