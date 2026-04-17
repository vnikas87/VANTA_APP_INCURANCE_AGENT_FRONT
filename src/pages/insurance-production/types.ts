import type { ProductionRecord } from '../../types/insurance';

export type CreateProductionResponse = {
  id: number;
};

export type FilterDraft = {
  query: string;
  customerIds: string[];
  companyIds: string[];
  productionTypeIds: string[];
  insuranceYears: string[];
  applicationDateFrom: string;
  applicationDateTo: string;
  annualNetMin: string;
  annualNetMax: string;
  tableFilters: Array<{ columnName: string; value: string; operator?: string }>;
};

export type FilterKey = keyof FilterDraft;

export type GridRow = {
  id: number;
  customer: string;
  customerId: string;
  policyNumber: string;
  identifier: string;
  partner: string;
  company: string;
  companyId: string;
  branch: string;
  contractType: string;
  documentType: string;
  productionType: string;
  productionTypeId: string;
  paymentFrequency: string;
  applicationDate: string;
  issueDate: string;
  deliveryDate: string;
  insuranceYear: string;
  installmentNumber: string;
  annualNetAmount: string;
  annualGrossAmount: string;
  installmentNetAmount: string;
  installmentGrossAmount: string;
  contractRate: string;
  contractCommission: string;
  incomingCommission: string;
  performanceRate: string;
  performanceAmount: string;
  differenceAmount: string;
  remarks: string;
  actions: string;
};

export type GridColumn = {
  name: keyof GridRow;
  title: string;
};

export type ProductionFilterOption = {
  key: FilterKey;
  label: string;
};

export type ProductionGridProps = {
  columns: GridColumn[];
  rows: GridRow[];
  columnOrder: string[];
  hiddenColumnNames: string[];
  grouping: Array<{ columnName: string }>;
  tableFilters: Array<{ columnName: string; value: string; operator?: string }>;
  sorting: Array<{ columnName: string; direction: 'asc' | 'desc' }>;
  onColumnOrderChange: (order: string[]) => void;
  onHiddenColumnNamesChange: (hiddenColumnNames: string[]) => void;
  onGroupingChange: (grouping: Array<{ columnName: string }>) => void;
  onTableFiltersChange: (tableFilters: Array<{ columnName: string; value: string; operator?: string }>) => void;
  onSortingChange: (sorting: Array<{ columnName: string; direction: 'asc' | 'desc' }>) => void;
};

export type FiltersPanelProps = {
  filtersOpen: boolean;
  setFiltersOpen: (next: boolean) => void;
  draftFilters: FilterDraft;
  setDraftFilters: (next: FilterDraft) => void;
  visibleFilterKeys: string[];
  setVisibleFilterKeys: (keys: string[]) => void;
  activeFilterCount: number;
  customerOptions: Array<{ value: string; label: string }>;
  companyOptions: Array<{ value: string; label: string }>;
  productionTypeOptions: Array<{ value: string; label: string }>;
  columnFilterOptions: Array<{ value: string; label: string; operators: string[] }>;
  availableFilterOptions: ProductionFilterOption[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onSaveView: () => void | Promise<void>;
};

export type BuildRowsInput = {
  records: ProductionRecord[];
};
