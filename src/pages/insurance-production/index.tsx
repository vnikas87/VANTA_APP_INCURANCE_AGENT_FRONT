import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row } from 'reactstrap';
import api from '../../api/client';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInsuranceCustomers,
  fetchInsuranceLookups,
  fetchInsurancePolicies,
  fetchProductionRecords,
  loadProductionGridPreferences,
  replaceProductionGridFilters,
  saveProductionGridPreferences,
  setProductionGridColumnOrder,
  setProductionGridGrouping,
  setProductionGridHiddenColumnNames,
  setProductionGridSorting,
  setProductionGridTableFilters,
  setProductionGridVisibleFilterKeys,
} from '../../store/slices/insuranceSlice';
import { toastError, toastSuccess } from '../../utils/alerts';
import { DEFAULT_COLUMN_ORDER, DEFAULT_VISIBLE_FILTER_KEYS } from './constants';
import ProductionActions from './components/ProductionActions';
import ProductionFilters from './components/ProductionFilters';
import ProductionGridCard from './components/ProductionGrid';
import type { CreateProductionResponse, FilterDraft, GridColumn, ProductionFilterOption } from './types';
import {
  buildGridRows,
  clearFilters,
  countActiveFilters,
  getFiltersFromSearchParams,
  setFiltersToSearchParams,
} from './utils';

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function sanitizeColumnOrder(order: string[], validColumns: string[], fallbackOrder: string[]): string[] {
  const validSet = new Set(validColumns);
  const safeOrder = unique(order.filter((name) => validSet.has(name)));
  const safeFallback = unique(fallbackOrder.filter((name) => validSet.has(name)));
  const safeValid = unique(validColumns.filter((name) => validSet.has(name)));
  const merged = unique([...safeOrder, ...safeFallback, ...safeValid]);
  if (!validSet.has('actions')) return merged;
  return ['actions', ...merged.filter((name) => name !== 'actions')];
}

function sanitizeStringList(values: string[], validColumns: Set<string>): string[] {
  return unique(values.filter((value) => validColumns.has(value)));
}

function InsuranceProductionPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const lookups = useAppSelector((state) => state.insurance.lookups);
  const customers = useAppSelector((state) => state.insurance.customers);
  const policies = useAppSelector((state) => state.insurance.policies);
  const records = useAppSelector((state) => state.insurance.records);
  const gridFilters = useAppSelector((state) => state.insurance.productionGrid.filters);
  const gridSorting = useAppSelector((state) => state.insurance.productionGrid.sorting);
  const gridColumnOrder = useAppSelector((state) => state.insurance.productionGrid.columnOrder);
  const gridHiddenColumnNames = useAppSelector((state) => state.insurance.productionGrid.hiddenColumnNames);
  const gridGrouping = useAppSelector((state) => state.insurance.productionGrid.grouping);
  const visibleFilterKeys = useAppSelector((state) => state.insurance.productionGrid.visibleFilterKeys);
  const preferencesLoaded = useAppSelector((state) => state.insurance.productionGrid.preferencesLoaded);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const hydrationDoneRef = useRef(false);
  const GRID_VIEW_KEY = 'insurance-production-main-grid';

  const [modalOpen, setModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(gridFilters);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | ''>('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [productionTypeId, setProductionTypeId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void dispatch(fetchInsuranceLookups());
    void dispatch(fetchInsuranceCustomers());
    void dispatch(fetchInsurancePolicies());
    void dispatch(loadProductionGridPreferences(GRID_VIEW_KEY));
  }, [dispatch]);

  useEffect(() => {
    if (gridColumnOrder.length === 0) {
      dispatch(setProductionGridColumnOrder(DEFAULT_COLUMN_ORDER));
    }
  }, [dispatch, gridColumnOrder.length]);

  useEffect(() => {
    if (visibleFilterKeys.length === 0) {
      dispatch(setProductionGridVisibleFilterKeys(DEFAULT_VISIBLE_FILTER_KEYS));
    }
  }, [dispatch, visibleFilterKeys.length]);

  useEffect(() => {
    if (!preferencesLoaded || hydrationDoneRef.current) return;
    const hasUrlFilters = searchParams.toString().trim().length > 0;
    if (hasUrlFilters) {
      const fromUrl = {
        ...getFiltersFromSearchParams(searchParams),
        tableFilters: gridFilters.tableFilters,
      };
      dispatch(replaceProductionGridFilters(fromUrl));
      setDraftFilters(fromUrl);
    } else {
      setDraftFilters(gridFilters);
    }
    hydrationDoneRef.current = true;
  }, [dispatch, preferencesLoaded, searchParams, gridFilters]);

  useEffect(() => {
    if (!hydrationDoneRef.current) return;
    setDraftFilters(gridFilters);
  }, [gridFilters]);

  useEffect(() => {
    void dispatch(fetchProductionRecords(gridFilters));
  }, [dispatch, gridFilters]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void dispatch(saveProductionGridPreferences(GRID_VIEW_KEY));
    }, 700);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [
    dispatch,
    preferencesLoaded,
    gridFilters,
    gridSorting,
    gridColumnOrder,
    gridHiddenColumnNames,
    gridGrouping,
    visibleFilterKeys,
  ]);

  useEffect(() => {
    const current = searchParams.toString();
    const params = setFiltersToSearchParams(new URLSearchParams(current), gridFilters);
    const next = params.toString();
    if (next !== current) {
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridFilters, setSearchParams]);

  const columns = useMemo<GridColumn[]>(
    () => [
      { name: 'id', title: 'ID' },
      { name: 'customer', title: t('insurance.customers.title') },
      { name: 'policyNumber', title: t('insurance.production.policy_number') },
      { name: 'identifier', title: t('insurance.field.identifier') },
      { name: 'partner', title: t('insurance.lookup.partners.title') },
      { name: 'company', title: t('insurance.lookup.companies.title') },
      { name: 'branch', title: t('insurance.lookup.branches.title') },
      { name: 'contractType', title: 'Contract' },
      { name: 'documentType', title: 'Document Type' },
      { name: 'productionType', title: t('insurance.production.production_type') },
      { name: 'paymentFrequency', title: 'Payment Frequency' },
      { name: 'applicationDate', title: t('insurance.production.application_date') },
      { name: 'issueDate', title: t('insurance.field.issue_date') },
      { name: 'deliveryDate', title: t('insurance.field.delivery_date') },
      { name: 'insuranceYear', title: 'Year' },
      { name: 'installmentNumber', title: t('insurance.field.installment') },
      { name: 'annualNetAmount', title: t('insurance.field.annual_net') },
      { name: 'annualGrossAmount', title: t('insurance.field.annual_gross') },
      { name: 'installmentNetAmount', title: t('insurance.field.installment_net') },
      { name: 'installmentGrossAmount', title: t('insurance.field.installment_gross') },
      { name: 'contractRate', title: t('insurance.field.contract_rate') },
      { name: 'contractCommission', title: t('insurance.field.contract_commission') },
      { name: 'incomingCommission', title: t('insurance.field.incoming_commission') },
      { name: 'performanceRate', title: t('insurance.field.performance_rate') },
      { name: 'performanceAmount', title: t('insurance.field.performance_amount') },
      { name: 'differenceAmount', title: t('insurance.field.difference') },
      { name: 'remarks', title: t('insurance.field.remarks') },
      { name: 'actions', title: t('app.actions') },
    ],
    [t]
  );
  const validColumnNames = useMemo(() => columns.map((column) => String(column.name)), [columns]);
  const validColumnNameSet = useMemo(() => new Set(validColumnNames), [validColumnNames]);
  const safeColumnOrder = useMemo(
    () => sanitizeColumnOrder(gridColumnOrder, validColumnNames, DEFAULT_COLUMN_ORDER),
    [gridColumnOrder, validColumnNames]
  );
  const safeHiddenColumnNames = useMemo(
    () => sanitizeStringList(gridHiddenColumnNames, validColumnNameSet),
    [gridHiddenColumnNames, validColumnNameSet]
  );
  const safeGrouping = useMemo(
    () => gridGrouping.filter((item) => item.columnName !== 'actions' && validColumnNameSet.has(item.columnName)),
    [gridGrouping, validColumnNameSet]
  );
  const safeSorting = useMemo(
    () =>
      gridSorting.filter(
        (item) =>
          validColumnNameSet.has(item.columnName) && (item.direction === 'asc' || item.direction === 'desc')
      ),
    [gridSorting, validColumnNameSet]
  );
  const safeTableFilters = useMemo(
    () =>
      gridFilters.tableFilters.filter(
        (item) =>
          typeof item.value === 'string' &&
          item.value.trim().length > 0 &&
          item.columnName !== 'actions' &&
          validColumnNameSet.has(item.columnName)
      ),
    [gridFilters.tableFilters, validColumnNameSet]
  );

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ value: String(customer.id), label: `${customer.lastName} ${customer.firstName ?? ''}`.trim() })),
    [customers]
  );

  const companyOptions = useMemo(
    () => lookups.companies.map((item) => ({ value: String(item.id), label: item.name ?? '-' })),
    [lookups.companies]
  );

  const productionTypeOptions = useMemo(
    () => lookups.productionTypes.map((item) => ({ value: String(item.id), label: item.name ?? '-' })),
    [lookups.productionTypes]
  );

  const availableFilterOptions = useMemo<ProductionFilterOption[]>(
    () => [
      { key: 'query', label: 'Global Search' },
      { key: 'customerIds', label: 'Customers' },
      { key: 'companyIds', label: 'Insurance Companies' },
      { key: 'productionTypeIds', label: 'Production Types' },
      { key: 'insuranceYears', label: 'Insurance Years' },
      { key: 'applicationDateFrom', label: 'Application Date From' },
      { key: 'applicationDateTo', label: 'Application Date To' },
      { key: 'annualNetMin', label: 'Annual Net Min' },
      { key: 'annualNetMax', label: 'Annual Net Max' },
    ],
    []
  );

  const columnFilterOptions = useMemo(
    () =>
      columns
        .filter((column) => column.name !== 'actions')
        .map((column) => {
          const numericCols = new Set([
            'id',
            'insuranceYear',
            'installmentNumber',
            'annualNetAmount',
            'annualGrossAmount',
            'installmentNetAmount',
            'installmentGrossAmount',
            'contractRate',
            'contractCommission',
            'incomingCommission',
            'performanceRate',
            'performanceAmount',
            'differenceAmount',
          ]);
          const dateCols = new Set(['applicationDate', 'issueDate', 'deliveryDate']);
          if (numericCols.has(column.name)) {
            return { value: column.name, label: column.title, operators: ['equals', 'gte', 'lte'] };
          }
          if (dateCols.has(column.name)) {
            return { value: column.name, label: column.title, operators: ['contains', 'equals', 'gte', 'lte'] };
          }
          return { value: column.name, label: column.title, operators: ['contains', 'equals', 'startsWith'] };
        }),
    [columns]
  );

  const rows = useMemo(() => buildGridRows(records), [records]);
  const activeFilterCount = useMemo(() => countActiveFilters(gridFilters), [gridFilters]);

  const customerPolicies = useMemo(() => {
    if (!selectedCustomerId) return [];
    return policies.filter((policy) => policy.customerId === Number(selectedCustomerId));
  }, [policies, selectedCustomerId]);

  const policyOptions = useMemo(
    () => customerPolicies.map((policy) => ({ value: policy.id, label: `#${policy.id} ${policy.policyNumber ?? '-'}` })),
    [customerPolicies]
  );

  const actionProductionTypeOptions = useMemo(
    () => lookups.productionTypes.map((item) => ({ value: item.id, label: item.name ?? '-' })),
    [lookups.productionTypes]
  );

  const resetQuickCreate = () => {
    setSelectedCustomerId('');
    setSelectedPolicyId('');
    setPolicyNumber('');
    setApplicationDate('');
    setProductionTypeId('');
  };

  const onOpenQuickCreate = () => {
    resetQuickCreate();
    setModalOpen(true);
  };

  const onSelectedCustomerChange = (value: number | '') => {
    setSelectedCustomerId(value);
    setSelectedPolicyId('');
    setPolicyNumber('');
  };

  const onApplyFilters = () => dispatch(replaceProductionGridFilters(draftFilters));
  const onClearFilters = () => {
    const empty = clearFilters();
    setDraftFilters(empty);
    dispatch(replaceProductionGridFilters(empty));
  };

  const onSaveView = async () => {
    try {
      await dispatch(saveProductionGridPreferences(GRID_VIEW_KEY)).unwrap();
      toastSuccess('View saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      toastError(message);
    }
  };

  const onCreateRecord = async () => {
    if (!selectedCustomerId) {
      toastError('Customer is required');
      return;
    }
    if (!selectedPolicyId && !policyNumber.trim()) {
      toastError('Policy Number is required when no existing policy is selected');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post<CreateProductionResponse>('/insurance/production-records', {
        policyId: selectedPolicyId ? Number(selectedPolicyId) : undefined,
        policy: selectedPolicyId
          ? undefined
          : {
              customerId: Number(selectedCustomerId),
              policyNumber: policyNumber.trim(),
            },
        transaction: {
          applicationDate: applicationDate || undefined,
          productionTypeId: productionTypeId || undefined,
        },
      });

      toastSuccess('Production record created');
      setModalOpen(false);
      await dispatch(fetchProductionRecords(gridFilters));
      navigate(`/insurance/production/${response.data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create production record';
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row className="g-3">
      <ProductionActions
        title={t('insurance.production.title')}
        subtitle={t('insurance.production.subtitle')}
        quickCreateLabel={t('insurance.production.quick_create')}
        modalOpen={modalOpen}
        saving={saving}
        selectedCustomerId={selectedCustomerId}
        selectedPolicyId={selectedPolicyId}
        policyNumber={policyNumber}
        applicationDate={applicationDate}
        productionTypeId={productionTypeId}
        customerOptions={customers.map((c) => ({ value: c.id, label: `${c.lastName} ${c.firstName ?? ''}`.trim() }))}
        policyOptions={policyOptions}
        productionTypeOptions={actionProductionTypeOptions}
        onOpenModal={onOpenQuickCreate}
        onCloseModal={() => setModalOpen(false)}
        onCreate={onCreateRecord}
        onSelectedCustomerChange={onSelectedCustomerChange}
        onSelectedPolicyChange={setSelectedPolicyId}
        onPolicyNumberChange={setPolicyNumber}
        onApplicationDateChange={setApplicationDate}
        onProductionTypeChange={setProductionTypeId}
        customersLabel={t('insurance.customers.title')}
        existingPolicyLabel={t('insurance.production.existing_policy_optional')}
        createNewPolicyLabel={t('insurance.production.create_new_policy')}
        policyNumberLabel={t('insurance.production.policy_number')}
        applicationDateLabel={t('insurance.production.application_date')}
        productionTypeLabel={t('insurance.production.production_type')}
        selectUserLabel={t('license.select_user')}
        cancelLabel={t('app.cancel')}
        createLabel={t('app.create')}
      />

      <ProductionFilters
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        visibleFilterKeys={visibleFilterKeys.length ? visibleFilterKeys : DEFAULT_VISIBLE_FILTER_KEYS}
        setVisibleFilterKeys={(keys) => dispatch(setProductionGridVisibleFilterKeys(keys))}
        activeFilterCount={activeFilterCount}
        customerOptions={customerOptions}
        companyOptions={companyOptions}
        productionTypeOptions={productionTypeOptions}
        columnFilterOptions={columnFilterOptions}
        availableFilterOptions={availableFilterOptions}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
        onSaveView={onSaveView}
      />

      <ProductionGridCard
        columns={columns}
        rows={rows}
        columnOrder={safeColumnOrder}
        hiddenColumnNames={safeHiddenColumnNames}
        grouping={safeGrouping}
        tableFilters={safeTableFilters}
        sorting={safeSorting}
        onColumnOrderChange={(order) => dispatch(setProductionGridColumnOrder(order))}
        onHiddenColumnNamesChange={(hiddenColumnNames) => dispatch(setProductionGridHiddenColumnNames(hiddenColumnNames))}
        onGroupingChange={(grouping) => dispatch(setProductionGridGrouping(grouping))}
        onTableFiltersChange={(tableFilters) => {
          if (JSON.stringify(safeTableFilters) === JSON.stringify(tableFilters)) return;
          setDraftFilters((prev) => ({ ...prev, tableFilters }));
          dispatch(setProductionGridTableFilters(tableFilters));
        }}
        onSortingChange={(sorting) => dispatch(setProductionGridSorting(sorting))}
        mainTableTitle={t('insurance.main_table')}
        openDetailsLabel={t('insurance.production.open_details')}
      />
    </Row>
  );
}

export default InsuranceProductionPage;
