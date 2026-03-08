export type NavigationRule = {
  id: number;
  subFolderId: number;
  roleName: string;
  canAccess: boolean;
};

export type NavigationSubFolder = {
  id: number;
  folderId: number;
  name: string;
  path: string;
  sortOrder: number;
  rules: NavigationRule[];
};

export type NavigationFolder = {
  id: number;
  groupId: number;
  name: string;
  sortOrder: number;
  subFolders: NavigationSubFolder[];
};

export type NavigationGroup = {
  id: number;
  name: string;
  sortOrder: number;
  folders: NavigationFolder[];
};

export type CreateGroupPayload = {
  name: string;
  sortOrder?: number;
};

export type CreateFolderPayload = {
  groupId: number;
  name: string;
  sortOrder?: number;
};

export type CreateSubFolderPayload = {
  folderId: number;
  name: string;
  path: string;
  sortOrder?: number;
};

export type CreateRulePayload = {
  subFolderId: number;
  roleName: string;
  canAccess: boolean;
};

export type NavigationRole = {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNavigationRolePayload = {
  name: string;
  description?: string;
  isSystem?: boolean;
};
