export type LookupItem = {
  id: number;
  code?: string | null;
  name?: string | null;
  greekLabel?: string | null;
  isActive?: boolean;
  companyId?: number | null;
  value?: number;
};

export type Customer = {
  id: number;
  firstName?: string | null;
  lastName: string;
  fullName?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
};

export type Policy = {
  id: number;
  policyNumber?: string | null;
  identifier?: string | null;
  customerId: number;
  partnerId?: number | null;
  companyId?: number | null;
  branchId?: number | null;
  contractTypeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  customer: Customer;
  partner?: LookupItem | null;
  company?: LookupItem | null;
  branch?: LookupItem | null;
  contractType?: LookupItem | null;
};

export type PolicyFinancial = {
  id: number;
  transactionId: number;
  annualNetAmount?: string | null;
  annualGrossAmount?: string | null;
  installmentNetAmount?: string | null;
  installmentGrossAmount?: string | null;
  contractRate?: string | null;
  contractCommission?: string | null;
  incomingCommission?: string | null;
  performanceRate?: string | null;
  performanceAmount?: string | null;
  differenceAmount?: string | null;
};

export type ProductionRecord = {
  id: number;
  policyId: number;
  applicationDate?: string | null;
  issueDate?: string | null;
  deliveryDate?: string | null;
  documentTypeId?: number | null;
  productionTypeId?: number | null;
  paymentFrequencyId?: number | null;
  insuranceYear?: number | null;
  installmentNumber?: number | null;
  remarks?: string | null;
  policy: Policy & {
    partner?: LookupItem | null;
    company?: LookupItem | null;
    branch?: LookupItem | null;
    contractType?: LookupItem | null;
  };
  documentType?: LookupItem | null;
  productionType?: LookupItem | null;
  paymentFrequency?: LookupItem | null;
  financials: PolicyFinancial[];
};

export type InsuranceLookupsResponse = {
  partners: LookupItem[];
  companies: LookupItem[];
  branches: LookupItem[];
  contractTypes: LookupItem[];
  documentTypes: LookupItem[];
  productionTypes: LookupItem[];
  paymentFrequencies: LookupItem[];
};

export type LookupTypeKey =
  | 'partners'
  | 'companies'
  | 'branches'
  | 'contract-types'
  | 'document-types'
  | 'production-types'
  | 'payment-frequencies';
