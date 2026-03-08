export type AuditUser = {
  id: number;
  keycloakId: string;
  name: string;
};

export type User = {
  id: number;
  keycloakId: string;
  name: string;
  email: string;
  phone?: string | null;
  mobilePhone?: string | null;
  companyRole?: string | null;
  signature?: string | null;
  avatarUrl?: string | null;
  createdId: number;
  updatedId: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: AuditUser;
  updatedBy?: AuditUser;
};

export type UserPayload = {
  keycloakId: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  companyRole?: string;
  signature?: string;
  avatarUrl?: string;
};

export type UserNotification = {
  id: number;
  eventType: string;
  details?: string | null;
  createdAt: string;
};

export type CurrentUserResponse = {
  user: User;
  notifications: UserNotification[];
};
