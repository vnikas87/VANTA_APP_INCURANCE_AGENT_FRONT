export type LicenseStatus = {
  id: number;
  maxUsers: number;
  isActive: boolean;
  allowOverflow: boolean;
  tenantCode: string | null;
  expiresAt: string | null;
  licenseTokenId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LicenseUsage = {
  usedUsers: number;
  availableSeats: number;
  atLimit: boolean;
};

export type LicenseSeatItem = {
  id: number;
  userId: number;
  isActive: boolean;
  notes: string | null;
  activatedAt: string;
  deactivatedAt: string | null;
  user: {
    id: number;
    keycloakId: string;
    name: string;
    email: string;
  };
};

export type LicenseGrantItem = {
  id: number;
  tokenId: string;
  seats: number;
  expiresAt: string | null;
  isActive: boolean;
  issuedTo: string | null;
  activatedAt: string;
  deactivatedAt: string | null;
};

export type LicenseAdminResponse = {
  license: LicenseStatus;
  usage: LicenseUsage;
  seats: LicenseSeatItem[];
  grants: LicenseGrantItem[];
};
