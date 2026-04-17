import type { ProductionRecord } from '../../types/insurance';
import type { FilterDraft, GridRow } from './types';
import { DEFAULT_FILTERS } from './constants';

export function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function asDateDisplay(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

export function asNumberDisplay(value?: string | null): string {
  if (!value) return '-';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function readMultiSelect(event: React.ChangeEvent<HTMLInputElement>): string[] {
  const target = event.target as unknown as HTMLSelectElement;
  return Array.from(target.selectedOptions).map((option) => option.value);
}

export function getFiltersFromSearchParams(searchParams: URLSearchParams): FilterDraft {
  return {
    query: searchParams.get('q') ?? '',
    customerIds: parseCsvParam(searchParams.get('customerIds')),
    companyIds: parseCsvParam(searchParams.get('companyIds')),
    productionTypeIds: parseCsvParam(searchParams.get('productionTypeIds')),
    insuranceYears: parseCsvParam(searchParams.get('insuranceYears')),
    applicationDateFrom: searchParams.get('applicationDateFrom') ?? '',
    applicationDateTo: searchParams.get('applicationDateTo') ?? '',
    annualNetMin: searchParams.get('annualNetMin') ?? '',
    annualNetMax: searchParams.get('annualNetMax') ?? '',
    tableFilters: [],
  };
}

export function setFiltersToSearchParams(current: URLSearchParams, filters: FilterDraft): URLSearchParams {
  const params = new URLSearchParams(current);
  const setOrDelete = (key: string, value: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  setOrDelete('q', filters.query);
  setOrDelete('customerIds', filters.customerIds.join(','));
  setOrDelete('companyIds', filters.companyIds.join(','));
  setOrDelete('productionTypeIds', filters.productionTypeIds.join(','));
  setOrDelete('insuranceYears', filters.insuranceYears.join(','));
  setOrDelete('applicationDateFrom', filters.applicationDateFrom);
  setOrDelete('applicationDateTo', filters.applicationDateTo);
  setOrDelete('annualNetMin', filters.annualNetMin);
  setOrDelete('annualNetMax', filters.annualNetMax);

  return params;
}

export function countActiveFilters(filters: FilterDraft): number {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    if (key === 'tableFilters') return acc + (Array.isArray(value) ? value.length : 0);
    if (Array.isArray(value)) return acc + (value.length > 0 ? 1 : 0);
    return acc + (value.trim() ? 1 : 0);
  }, 0);
}

export function clearFilters(): FilterDraft {
  return { ...DEFAULT_FILTERS };
}

export function applySmartFilters(records: ProductionRecord[], filters: FilterDraft): ProductionRecord[] {
  const query = filters.query.trim().toLowerCase();
  const minNet = filters.annualNetMin.trim() ? Number(filters.annualNetMin) : null;
  const maxNet = filters.annualNetMax.trim() ? Number(filters.annualNetMax) : null;
  const dateFrom = filters.applicationDateFrom ? new Date(filters.applicationDateFrom).getTime() : null;
  const dateTo = filters.applicationDateTo ? new Date(filters.applicationDateTo).getTime() : null;

  return records.filter((row) => {
    const policy = row.policy;
    const customer = policy?.customer;
    const companyId = String(policy?.companyId ?? '');
    const productionTypeId = String(row.productionTypeId ?? '');
    const insuranceYear = String(row.insuranceYear ?? '');

    if (filters.customerIds.length > 0 && !filters.customerIds.includes(String(policy?.customerId ?? ''))) return false;
    if (filters.companyIds.length > 0 && !filters.companyIds.includes(companyId)) return false;
    if (filters.productionTypeIds.length > 0 && !filters.productionTypeIds.includes(productionTypeId)) return false;
    if (filters.insuranceYears.length > 0 && !filters.insuranceYears.includes(insuranceYear)) return false;

    const appDate = row.applicationDate ? new Date(row.applicationDate).getTime() : null;
    if (dateFrom && (!appDate || appDate < dateFrom)) return false;
    if (dateTo && (!appDate || appDate > dateTo)) return false;

    const annualNet = Number(row.financials[0]?.annualNetAmount ?? NaN);
    if (minNet != null && (!Number.isFinite(annualNet) || annualNet < minNet)) return false;
    if (maxNet != null && (!Number.isFinite(annualNet) || annualNet > maxNet)) return false;

    if (query) {
      const text = [
        row.id,
        customer?.lastName,
        customer?.firstName,
        policy?.policyNumber,
        policy?.identifier,
        policy?.partner?.name,
        policy?.company?.name,
        policy?.branch?.name,
        policy?.contractType?.name,
        row.documentType?.name,
        row.productionType?.name,
        row.paymentFrequency?.name,
        row.insuranceYear,
        row.installmentNumber,
        row.remarks,
        row.financials[0]?.annualNetAmount,
        row.financials[0]?.contractCommission,
        row.financials[0]?.differenceAmount,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!text.includes(query)) return false;
    }

    return true;
  });
}

export function buildGridRows(records: ProductionRecord[]): GridRow[] {
  return records.map((row) => {
    const policy = row.policy;
    const customer = policy?.customer;
    const financial = row.financials?.[0];
    return {
      id: row.id,
      customer: `${customer?.lastName ?? '-'} ${customer?.firstName ?? ''}`.trim(),
      customerId: String(policy?.customerId ?? ''),
      policyNumber: policy?.policyNumber ?? '-',
      identifier: policy?.identifier ?? '-',
      partner: policy?.partner?.name ?? '-',
      company: policy?.company?.name ?? '-',
      companyId: String(policy?.companyId ?? ''),
      branch: policy?.branch?.name ?? '-',
      contractType: policy?.contractType?.name ?? '-',
      documentType: row.documentType?.name ?? '-',
      productionType: row.productionType?.name ?? '-',
      productionTypeId: String(row.productionTypeId ?? ''),
      paymentFrequency: row.paymentFrequency?.name ?? (row.paymentFrequency?.value ? String(row.paymentFrequency.value) : '-'),
      applicationDate: asDateDisplay(row.applicationDate),
      issueDate: asDateDisplay(row.issueDate),
      deliveryDate: asDateDisplay(row.deliveryDate),
      insuranceYear: row.insuranceYear != null ? String(row.insuranceYear) : '-',
      installmentNumber: row.installmentNumber != null ? String(row.installmentNumber) : '-',
      annualNetAmount: asNumberDisplay(financial?.annualNetAmount),
      annualGrossAmount: asNumberDisplay(financial?.annualGrossAmount),
      installmentNetAmount: asNumberDisplay(financial?.installmentNetAmount),
      installmentGrossAmount: asNumberDisplay(financial?.installmentGrossAmount),
      contractRate: asNumberDisplay(financial?.contractRate),
      contractCommission: asNumberDisplay(financial?.contractCommission),
      incomingCommission: asNumberDisplay(financial?.incomingCommission),
      performanceRate: asNumberDisplay(financial?.performanceRate),
      performanceAmount: asNumberDisplay(financial?.performanceAmount),
      differenceAmount: asNumberDisplay(financial?.differenceAmount),
      remarks: row.remarks ?? '-',
      actions: String(row.id),
    };
  });
}
