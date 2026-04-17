import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/client';
import type {
  Customer,
  InsuranceLookupsResponse,
  LookupTypeKey,
  Policy,
  ProductionRecord,
} from '../../types/insurance';
import { sweetAlert, toastError, toastSuccess } from '../../utils/alerts';

type InsuranceState = {
  lookups: InsuranceLookupsResponse;
  customers: Customer[];
  policies: Policy[];
  records: ProductionRecord[];
  loading: boolean;
  error: string | null;
  productionGrid: {
    filters: {
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
    sorting: Array<{ columnName: string; direction: 'asc' | 'desc' }>;
    columnOrder: string[];
    hiddenColumnNames: string[];
    grouping: Array<{ columnName: string }>;
    visibleFilterKeys: string[];
    preferencesLoaded: boolean;
  };
};

type ProductionRecordFilters = InsuranceState['productionGrid']['filters'];

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const initialState: InsuranceState = {
  lookups: {
    partners: [],
    companies: [],
    branches: [],
    contractTypes: [],
    documentTypes: [],
    productionTypes: [],
    paymentFrequencies: [],
  },
  customers: [],
  policies: [],
  records: [],
  loading: false,
  error: null,
  productionGrid: {
    filters: {
      query: '',
      customerIds: [],
      companyIds: [],
      productionTypeIds: [],
      insuranceYears: [],
      applicationDateFrom: '',
      applicationDateTo: '',
      annualNetMin: '',
      annualNetMax: '',
      tableFilters: [],
    },
    sorting: [{ columnName: 'id', direction: 'desc' }],
    columnOrder: [],
    hiddenColumnNames: [],
    grouping: [],
    visibleFilterKeys: [
      'query',
      'customerIds',
      'companyIds',
      'productionTypeIds',
      'insuranceYears',
      'applicationDateFrom',
      'applicationDateTo',
      'annualNetMin',
      'annualNetMax',
    ],
    preferencesLoaded: false,
  },
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeAxios = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
    const msg = maybeAxios.response?.data?.error ?? maybeAxios.response?.data?.message;
    const status = maybeAxios.response?.status;
    if (msg && status) return `[${status}] ${msg}`;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const fetchInsuranceLookups = createAsyncThunk('insurance/fetchLookups', async () => {
  const response = await api.get<InsuranceLookupsResponse>('/insurance/lookups');
  return response.data;
});

export const fetchInsuranceCustomers = createAsyncThunk('insurance/fetchCustomers', async () => {
  const response = await api.get<Customer[]>('/insurance/customers');
  return response.data;
});

export const fetchInsurancePolicies = createAsyncThunk('insurance/fetchPolicies', async () => {
  const response = await api.get<Policy[]>('/insurance/policies');
  return response.data;
});

export const fetchProductionRecords = createAsyncThunk(
  'insurance/fetchProductionRecords',
  async (filters?: Partial<ProductionRecordFilters>) => {
    const params = {
      q: filters?.query?.trim() || undefined,
      customerIds: filters?.customerIds && filters.customerIds.length > 0 ? filters.customerIds.join(',') : undefined,
      companyIds: filters?.companyIds && filters.companyIds.length > 0 ? filters.companyIds.join(',') : undefined,
      productionTypeIds:
        filters?.productionTypeIds && filters.productionTypeIds.length > 0
          ? filters.productionTypeIds.join(',')
          : undefined,
      insuranceYears:
        filters?.insuranceYears && filters.insuranceYears.length > 0 ? filters.insuranceYears.join(',') : undefined,
      applicationDateFrom: filters?.applicationDateFrom || undefined,
      applicationDateTo: filters?.applicationDateTo || undefined,
      annualNetMin: filters?.annualNetMin || undefined,
      annualNetMax: filters?.annualNetMax || undefined,
      columnFilters:
        filters?.tableFilters && filters.tableFilters.length > 0 ? JSON.stringify(filters.tableFilters) : undefined,
    };

    const response = await api.get<ProductionRecord[]>('/insurance/production-records', { params });
    return response.data;
  }
);

export const loadProductionGridPreferences = createAsyncThunk(
  'insurance/loadProductionGridPreferences',
  async (viewKey: string) => {
    const response = await api.get(`/insurance/grid-preferences/${encodeURIComponent(viewKey)}`);
    return response.data as
      | {
          filtersJson?: unknown;
          sortingJson?: unknown;
          columnOrderJson?: unknown;
          hiddenColumnNamesJson?: unknown;
          groupingJson?: unknown;
          visibleFilterKeysJson?: unknown;
          tableFiltersJson?: unknown;
        }
      | null;
  }
);

export const saveProductionGridPreferences = createAsyncThunk(
  'insurance/saveProductionGridPreferences',
  async (viewKey: string, { getState }) => {
    const state = getState() as { insurance: InsuranceState };
    const grid = state.insurance.productionGrid;
    const response = await api.put(`/insurance/grid-preferences/${encodeURIComponent(viewKey)}`, {
      filtersJson: {
        query: grid.filters.query,
        customerIds: grid.filters.customerIds,
        companyIds: grid.filters.companyIds,
        productionTypeIds: grid.filters.productionTypeIds,
        insuranceYears: grid.filters.insuranceYears,
        applicationDateFrom: grid.filters.applicationDateFrom,
        applicationDateTo: grid.filters.applicationDateTo,
        annualNetMin: grid.filters.annualNetMin,
        annualNetMax: grid.filters.annualNetMax,
      },
      sortingJson: grid.sorting,
      columnOrderJson: grid.columnOrder,
      hiddenColumnNamesJson: grid.hiddenColumnNames,
      groupingJson: grid.grouping,
      visibleFilterKeysJson: grid.visibleFilterKeys,
      tableFiltersJson: grid.filters.tableFilters,
    });
    return response.data;
  }
);

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asTableFilters(
  value: unknown
): Array<{
  columnName: string;
  value: string;
  operator?: string;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => item as { columnName?: unknown; value?: unknown; operator?: unknown })
    .filter((item) => typeof item.columnName === 'string' && typeof item.value === 'string')
    .map((item) => ({
      columnName: String(item.columnName),
      value: String(item.value),
      operator: typeof item.operator === 'string' ? item.operator : undefined,
    }));
}

function asSorting(
  value: unknown
): Array<{
  columnName: string;
  direction: 'asc' | 'desc';
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => item as { columnName?: unknown; direction?: unknown })
    .filter((item) => typeof item.columnName === 'string' && (item.direction === 'asc' || item.direction === 'desc'))
    .map((item) => ({ columnName: String(item.columnName), direction: item.direction as 'asc' | 'desc' }));
}

function asGrouping(value: unknown): Array<{ columnName: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => item as { columnName?: unknown })
    .filter((item) => typeof item.columnName === 'string')
    .map((item) => ({ columnName: String(item.columnName) }));
}

export const refreshInsuranceModule =
  () => async (dispatch: any): Promise<void> => {
    await Promise.all([
      dispatch(fetchInsuranceLookups()),
      dispatch(fetchInsuranceCustomers()),
      dispatch(fetchInsurancePolicies()),
      dispatch(fetchProductionRecords()),
    ]);
  };

export const createLookupItem =
  (type: LookupTypeKey, payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.post(`/insurance/lookups/${type}`, payload);
      toastSuccess('Lookup item created');
      await dispatch(fetchInsuranceLookups());
    } catch (error) {
      toastError(`Create failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateLookupItem =
  (type: LookupTypeKey, id: number, payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/insurance/lookups/${type}/${id}`, payload);
      toastSuccess('Lookup item updated');
      await dispatch(fetchInsuranceLookups());
    } catch (error) {
      toastError(`Update failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteLookupItem =
  (type: LookupTypeKey, id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/insurance/lookups/${type}/${id}`);
      toastSuccess('Lookup item deleted');
      await dispatch(fetchInsuranceLookups());
    } catch (error) {
      toastError(`Delete failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createInsuranceCustomer =
  (payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/insurance/customers', payload);
      toastSuccess('Customer created');
      await Promise.all([dispatch(fetchInsuranceCustomers()), dispatch(fetchInsurancePolicies())]);
    } catch (error) {
      toastError(`Create customer failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateInsuranceCustomer =
  (id: number, payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/insurance/customers/${id}`, payload);
      toastSuccess('Customer updated');
      await Promise.all([dispatch(fetchInsuranceCustomers()), dispatch(fetchInsurancePolicies())]);
    } catch (error) {
      toastError(`Update customer failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteInsuranceCustomer =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/insurance/customers/${id}`);
      toastSuccess('Customer deleted');
      await Promise.all([dispatch(fetchInsuranceCustomers()), dispatch(fetchInsurancePolicies())]);
    } catch (error) {
      toastError(`Delete customer failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createInsurancePolicy =
  (payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/insurance/policies', payload);
      toastSuccess('Policy created');
      await dispatch(fetchInsurancePolicies());
    } catch (error) {
      toastError(`Create policy failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createProductionRecord =
  (payload: Record<string, unknown>) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/insurance/production-records', payload);
      toastSuccess('Production record created');
      await Promise.all([dispatch(fetchInsurancePolicies()), dispatch(fetchProductionRecords())]);
    } catch (error) {
      toastError(`Create record failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

const insuranceSlice = createSlice({
  name: 'insurance',
  initialState,
  reducers: {
    replaceProductionGridFilters: (
      state,
      action: PayloadAction<InsuranceState['productionGrid']['filters']>
    ) => {
      state.productionGrid.filters = action.payload;
    },
    resetProductionGridFilters: (state) => {
      state.productionGrid.filters = initialState.productionGrid.filters;
    },
    setProductionGridSorting: (
      state,
      action: PayloadAction<Array<{ columnName: string; direction: 'asc' | 'desc' }>>
    ) => {
      if (sameJson(state.productionGrid.sorting, action.payload)) return;
      state.productionGrid.sorting = action.payload;
    },
    setProductionGridColumnOrder: (state, action: PayloadAction<string[]>) => {
      if (sameJson(state.productionGrid.columnOrder, action.payload)) return;
      state.productionGrid.columnOrder = action.payload;
    },
    setProductionGridVisibleFilterKeys: (state, action: PayloadAction<string[]>) => {
      if (sameJson(state.productionGrid.visibleFilterKeys, action.payload)) return;
      state.productionGrid.visibleFilterKeys = action.payload;
    },
    setProductionGridHiddenColumnNames: (state, action: PayloadAction<string[]>) => {
      if (sameJson(state.productionGrid.hiddenColumnNames, action.payload)) return;
      state.productionGrid.hiddenColumnNames = action.payload;
    },
    setProductionGridGrouping: (state, action: PayloadAction<Array<{ columnName: string }>>) => {
      if (sameJson(state.productionGrid.grouping, action.payload)) return;
      state.productionGrid.grouping = action.payload;
    },
    setProductionGridTableFilters: (
      state,
      action: PayloadAction<Array<{ columnName: string; value: string; operator?: string }>>
    ) => {
      if (sameJson(state.productionGrid.filters.tableFilters, action.payload)) return;
      state.productionGrid.filters.tableFilters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsuranceLookups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInsuranceLookups.fulfilled, (state, action) => {
        state.loading = false;
        state.lookups = action.payload;
      })
      .addCase(fetchInsuranceLookups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load insurance lookups';
      })
      .addCase(fetchInsuranceCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(fetchInsurancePolicies.fulfilled, (state, action) => {
        state.policies = action.payload;
      })
      .addCase(fetchProductionRecords.fulfilled, (state, action) => {
        state.records = action.payload;
      })
      .addCase(loadProductionGridPreferences.fulfilled, (state, action) => {
        state.productionGrid.preferencesLoaded = true;
        const payload = action.payload;
        if (!payload) return;

        const filtersJson =
          payload.filtersJson && typeof payload.filtersJson === 'object' ? (payload.filtersJson as Record<string, unknown>) : {};

        state.productionGrid.filters.query =
          typeof filtersJson.query === 'string' ? filtersJson.query : state.productionGrid.filters.query;
        state.productionGrid.filters.customerIds = asStringArray(filtersJson.customerIds);
        state.productionGrid.filters.companyIds = asStringArray(filtersJson.companyIds);
        state.productionGrid.filters.productionTypeIds = asStringArray(filtersJson.productionTypeIds);
        state.productionGrid.filters.insuranceYears = asStringArray(filtersJson.insuranceYears);
        state.productionGrid.filters.applicationDateFrom =
          typeof filtersJson.applicationDateFrom === 'string' ? filtersJson.applicationDateFrom : '';
        state.productionGrid.filters.applicationDateTo =
          typeof filtersJson.applicationDateTo === 'string' ? filtersJson.applicationDateTo : '';
        state.productionGrid.filters.annualNetMin =
          typeof filtersJson.annualNetMin === 'string' ? filtersJson.annualNetMin : '';
        state.productionGrid.filters.annualNetMax =
          typeof filtersJson.annualNetMax === 'string' ? filtersJson.annualNetMax : '';

        state.productionGrid.filters.tableFilters = asTableFilters(payload.tableFiltersJson);
        state.productionGrid.sorting = asSorting(payload.sortingJson);
        state.productionGrid.columnOrder = asStringArray(payload.columnOrderJson);
        state.productionGrid.hiddenColumnNames = asStringArray(payload.hiddenColumnNamesJson);
        state.productionGrid.grouping = asGrouping(payload.groupingJson);
        state.productionGrid.visibleFilterKeys = asStringArray(payload.visibleFilterKeysJson);
      })
      .addCase(loadProductionGridPreferences.rejected, (state) => {
        state.productionGrid.preferencesLoaded = true;
      });
  },
});

export const {
  replaceProductionGridFilters,
  resetProductionGridFilters,
  setProductionGridSorting,
  setProductionGridColumnOrder,
  setProductionGridVisibleFilterKeys,
  setProductionGridHiddenColumnNames,
  setProductionGridGrouping,
  setProductionGridTableFilters,
} = insuranceSlice.actions;

export default insuranceSlice.reducer;
