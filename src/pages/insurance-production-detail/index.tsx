import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardBody, Col, Input, Label, Row } from 'reactstrap';
import AppModal from '../../components/common/AppModal';
import api from '../../api/client';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchInsuranceLookups, fetchProductionRecords } from '../../store/slices/insuranceSlice';
import type { ProductionRecord } from '../../types/insurance';
import { toastError, toastSuccess } from '../../utils/alerts';

type FinancialForm = {
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
};

function asInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formatDisplayDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function asPayloadNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asPayloadDecimal(value: string): string | null {
  if (!value.trim()) return null;
  return value.trim();
}

function asPreviewNumber(value?: string | null): string {
  if (!value) return '-';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InsuranceProductionDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lookups = useAppSelector((state) => state.insurance.lookups);

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<'policy' | 'transaction' | 'financial' | null>(null);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);

  const [policyNumber, setPolicyNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [contractTypeId, setContractTypeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [applicationDate, setApplicationDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState<number | ''>('');
  const [productionTypeId, setProductionTypeId] = useState<number | ''>('');
  const [paymentFrequencyId, setPaymentFrequencyId] = useState<number | ''>('');
  const [insuranceYear, setInsuranceYear] = useState('');
  const [installmentNumber, setInstallmentNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [financialId, setFinancialId] = useState<number | null>(null);
  const [financial, setFinancial] = useState<FinancialForm>({
    annualNetAmount: '',
    annualGrossAmount: '',
    installmentNetAmount: '',
    installmentGrossAmount: '',
    contractRate: '',
    contractCommission: '',
    incomingCommission: '',
    performanceRate: '',
    performanceAmount: '',
    differenceAmount: '',
  });

  const loadRecord = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ProductionRecord>(`/insurance/production-records/${id}`);
      const row = response.data;
      setRecord(row);

      setPolicyNumber(row.policy.policyNumber ?? '');
      setIdentifier(row.policy.identifier ?? '');
      setPartnerId(row.policy.partnerId ?? '');
      setCompanyId(row.policy.companyId ?? '');
      setBranchId(row.policy.branchId ?? '');
      setContractTypeId(row.policy.contractTypeId ?? '');
      setStartDate(asInputDate(row.policy.startDate));
      setEndDate(asInputDate(row.policy.endDate));

      setApplicationDate(asInputDate(row.applicationDate));
      setIssueDate(asInputDate(row.issueDate));
      setDeliveryDate(asInputDate(row.deliveryDate));
      setDocumentTypeId(row.documentTypeId ?? '');
      setProductionTypeId(row.productionTypeId ?? '');
      setPaymentFrequencyId(row.paymentFrequencyId ?? '');
      setInsuranceYear(row.insuranceYear ? String(row.insuranceYear) : '');
      setInstallmentNumber(row.installmentNumber ? String(row.installmentNumber) : '');
      setRemarks(row.remarks ?? '');

      const firstFinancial = row.financials[0];
      setFinancialId(firstFinancial?.id ?? null);
      setFinancial({
        annualNetAmount: firstFinancial?.annualNetAmount ?? '',
        annualGrossAmount: firstFinancial?.annualGrossAmount ?? '',
        installmentNetAmount: firstFinancial?.installmentNetAmount ?? '',
        installmentGrossAmount: firstFinancial?.installmentGrossAmount ?? '',
        contractRate: firstFinancial?.contractRate ?? '',
        contractCommission: firstFinancial?.contractCommission ?? '',
        incomingCommission: firstFinancial?.incomingCommission ?? '',
        performanceRate: firstFinancial?.performanceRate ?? '',
        performanceAmount: firstFinancial?.performanceAmount ?? '',
        differenceAmount: firstFinancial?.differenceAmount ?? '',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load production record';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void dispatch(fetchInsuranceLookups());
  }, [dispatch]);

  useEffect(() => {
    void loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const customerName = useMemo(() => {
    if (!record) return '-';
    return `${record.policy.customer.lastName} ${record.policy.customer.firstName ?? ''}`.trim();
  }, [record]);

  const savePolicy = async () => {
    if (!record) return;
    try {
      setSavingSection('policy');
      await api.patch(`/insurance/policies/${record.policy.id}`, {
        customerId: record.policy.customerId,
        policyNumber: policyNumber.trim() || null,
        identifier: identifier.trim() || null,
        partnerId: partnerId || null,
        companyId: companyId || null,
        branchId: branchId || null,
        contractTypeId: contractTypeId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      toastSuccess('Policy saved');
      setPolicyModalOpen(false);
      await loadRecord();
      await dispatch(fetchProductionRecords());
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save policy');
    } finally {
      setSavingSection(null);
    }
  };

  const saveTransaction = async () => {
    if (!record) return;
    try {
      setSavingSection('transaction');
      await api.patch(`/insurance/production-records/${record.id}`, {
        policyId: record.policy.id,
        applicationDate: applicationDate || null,
        issueDate: issueDate || null,
        deliveryDate: deliveryDate || null,
        documentTypeId: documentTypeId || null,
        productionTypeId: productionTypeId || null,
        paymentFrequencyId: paymentFrequencyId || null,
        insuranceYear: asPayloadNumber(insuranceYear),
        installmentNumber: asPayloadNumber(installmentNumber),
        remarks: remarks || null,
      });
      toastSuccess('Transaction saved');
      setTransactionModalOpen(false);
      await loadRecord();
      await dispatch(fetchProductionRecords());
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save transaction');
    } finally {
      setSavingSection(null);
    }
  };

  const saveFinancial = async () => {
    if (!record) return;
    const payload = {
      annualNetAmount: asPayloadDecimal(financial.annualNetAmount),
      annualGrossAmount: asPayloadDecimal(financial.annualGrossAmount),
      installmentNetAmount: asPayloadDecimal(financial.installmentNetAmount),
      installmentGrossAmount: asPayloadDecimal(financial.installmentGrossAmount),
      contractRate: asPayloadDecimal(financial.contractRate),
      contractCommission: asPayloadDecimal(financial.contractCommission),
      incomingCommission: asPayloadDecimal(financial.incomingCommission),
      performanceRate: asPayloadDecimal(financial.performanceRate),
      performanceAmount: asPayloadDecimal(financial.performanceAmount),
      differenceAmount: asPayloadDecimal(financial.differenceAmount),
    };
    try {
      setSavingSection('financial');
      if (financialId) {
        await api.patch(`/insurance/policy-financials/${financialId}`, payload);
      } else {
        const created = await api.post<{ id: number }>('/insurance/policy-financials', {
          transactionId: record.id,
          ...payload,
        });
        setFinancialId(created.data.id);
      }
      toastSuccess('Financial data saved');
      setFinancialModalOpen(false);
      await loadRecord();
      await dispatch(fetchProductionRecords());
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to save financial data');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) return null;

  if (error || !record) {
    return (
      <Row>
        <Col lg="12">
          <Alert color="danger">{error ?? 'Not found'}</Alert>
          <Button tag={Link} to="/insurance/production" color="secondary">
            {t('app.back')}
          </Button>
        </Col>
      </Row>
    );
  }

  const customer = record.policy.customer;
  const fin = record.financials[0];

  return (
    <Row className="g-3 insurance-details-page">
      <Col lg="12">
        <Card className="panel-card production-hero-card">
          <CardBody className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Badge color="primary" pill>
                  ID #{record.id}
                </Badge>
                <Badge color="light" pill className="text-uppercase">
                  {record.productionType?.name ?? t('insurance.production.transaction')}
                </Badge>
              </div>
              <h4 className="mb-1">{customerName}</h4>
              <div className="text-muted">
                {t('insurance.production.policy_number')}: <strong>{record.policy.policyNumber ?? '-'}</strong>
              </div>
              <div className="text-muted">
                {t('insurance.production.application_date')}: <strong>{formatDisplayDate(record.applicationDate)}</strong>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button color="light" onClick={() => navigate('/insurance/production')}>
                {t('app.back')}
              </Button>
              <Button color="light" onClick={() => void loadRecord()}>
                {t('license.refresh')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </Col>

      <Col md="4">
        <Card className="panel-card h-100">
          <CardBody>
            <div className="text-muted fs-12 mb-1">{t('insurance.production.customer_main')}</div>
            <div className="fw-semibold mb-2">{customerName}</div>
            <div className="fs-12 text-muted">{t('users.email')}: {customer.email ?? '-'}</div>
            <div className="fs-12 text-muted">{t('profile.phone')}: {customer.phone ?? '-'}</div>
            <div className="fs-12 text-muted">{t('profile.mobile')}: {customer.mobilePhone ?? '-'}</div>
            <div className="fs-12 text-muted">{t('insurance.field.tax_number')}: {customer.taxNumber ?? '-'}</div>
          </CardBody>
        </Card>
      </Col>

      <Col md="4">
        <Card className="panel-card h-100">
          <CardBody>
            <div className="text-muted fs-12 mb-1">{t('insurance.policies.title')}</div>
            <div className="fw-semibold mb-2">{record.policy.policyNumber ?? '-'}</div>
            <div className="fs-12 text-muted">{t('insurance.lookup.companies.title')}: {record.policy.company?.name ?? '-'}</div>
            <div className="fs-12 text-muted">{t('insurance.lookup.branches.title')}: {record.policy.branch?.name ?? '-'}</div>
            <div className="fs-12 text-muted">{t('insurance.lookup.contract-types.title')}: {record.policy.contractType?.name ?? '-'}</div>
            <div className="fs-12 text-muted">{t('insurance.field.start_date')}: {formatDisplayDate(record.policy.startDate)}</div>
            <div className="fs-12 text-muted">{t('insurance.field.end_date')}: {formatDisplayDate(record.policy.endDate)}</div>
          </CardBody>
        </Card>
      </Col>

      <Col md="4">
        <Card className="panel-card h-100">
          <CardBody>
            <div className="text-muted fs-12 mb-1">{t('insurance.production.financial')}</div>
            <div className="fw-semibold mb-2">{asPreviewNumber(fin?.annualNetAmount)}</div>
            <div className="fs-12 text-muted">{t('insurance.field.annual_gross')}: {asPreviewNumber(fin?.annualGrossAmount)}</div>
            <div className="fs-12 text-muted">{t('insurance.field.contract_commission')}: {asPreviewNumber(fin?.contractCommission)}</div>
            <div className="fs-12 text-muted">{t('insurance.field.performance_amount')}: {asPreviewNumber(fin?.performanceAmount)}</div>
            <div className="fs-12 text-muted">{t('insurance.field.difference')}: {asPreviewNumber(fin?.differenceAmount)}</div>
          </CardBody>
        </Card>
      </Col>

      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">{t('insurance.policies.title')}</h6>
              <Button color="primary" size="sm" onClick={() => setPolicyModalOpen(true)}>
                {t('app.edit')}
              </Button>
            </div>
            <Row className="g-2">
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.production.policy_number')}</div><div>{record.policy.policyNumber ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.field.identifier')}</div><div>{record.policy.identifier ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.lookup.partners.title')}</div><div>{record.policy.partner?.name ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.lookup.companies.title')}</div><div>{record.policy.company?.name ?? '-'}</div></Col>
            </Row>
          </CardBody>
        </Card>
      </Col>

      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">{t('insurance.production.transaction')}</h6>
              <Button color="primary" size="sm" onClick={() => setTransactionModalOpen(true)}>
                {t('app.edit')}
              </Button>
            </div>
            <Row className="g-2">
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.production.application_date')}</div><div>{formatDisplayDate(record.applicationDate)}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.field.issue_date')}</div><div>{formatDisplayDate(record.issueDate)}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.field.delivery_date')}</div><div>{formatDisplayDate(record.deliveryDate)}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.lookup.document-types.title')}</div><div>{record.documentType?.name ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.production.production_type')}</div><div>{record.productionType?.name ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.lookup.payment-frequencies.title')}</div><div>{record.paymentFrequency?.name ?? record.paymentFrequency?.value ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.field.insurance_year')}</div><div>{record.insuranceYear ?? '-'}</div></Col>
              <Col md="3"><div className="fs-12 text-muted">{t('insurance.field.installment')}</div><div>{record.installmentNumber ?? '-'}</div></Col>
              <Col md="12"><div className="fs-12 text-muted">{t('insurance.field.remarks')}</div><div>{record.remarks ?? '-'}</div></Col>
            </Row>
          </CardBody>
        </Card>
      </Col>

      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">{t('insurance.production.financial')}</h6>
              <Button color="primary" size="sm" onClick={() => setFinancialModalOpen(true)}>
                {t('app.edit')}
              </Button>
            </div>
            <Row className="g-2">
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.annual_net')}</div><div>{asPreviewNumber(fin?.annualNetAmount)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.annual_gross')}</div><div>{asPreviewNumber(fin?.annualGrossAmount)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.installment_net')}</div><div>{asPreviewNumber(fin?.installmentNetAmount)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.installment_gross')}</div><div>{asPreviewNumber(fin?.installmentGrossAmount)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.contract_rate')}</div><div>{asPreviewNumber(fin?.contractRate)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.contract_commission')}</div><div>{asPreviewNumber(fin?.contractCommission)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.incoming_commission')}</div><div>{asPreviewNumber(fin?.incomingCommission)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.performance_rate')}</div><div>{asPreviewNumber(fin?.performanceRate)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.performance_amount')}</div><div>{asPreviewNumber(fin?.performanceAmount)}</div></Col>
              <Col md="2"><div className="fs-12 text-muted">{t('insurance.field.difference')}</div><div>{asPreviewNumber(fin?.differenceAmount)}</div></Col>
            </Row>
          </CardBody>
        </Card>
      </Col>

      <AppModal
        isOpen={policyModalOpen}
        title={t('insurance.policies.title')}
        onClose={() => setPolicyModalOpen(false)}
        footer={(
          <>
            <Button color="secondary" onClick={() => setPolicyModalOpen(false)}>{t('app.cancel')}</Button>
            <Button color="primary" onClick={() => void savePolicy()} disabled={savingSection === 'policy'}>
              {t('app.save')}
            </Button>
          </>
        )}
      >
        <Row className="g-2">
          <Col md="6"><Label className="fs-12">{t('insurance.production.policy_number')}</Label><Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.identifier')}</Label><Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.partners.title')}</Label>
            <Input type="select" value={partnerId} onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.partners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.companies.title')}</Label>
            <Input type="select" value={companyId} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.branches.title')}</Label>
            <Input type="select" value={branchId} onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.contract-types.title')}</Label>
            <Input type="select" value={contractTypeId} onChange={(e) => setContractTypeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.contractTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.start_date')}</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.end_date')}</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Col>
        </Row>
      </AppModal>

      <AppModal
        isOpen={transactionModalOpen}
        title={t('insurance.production.transaction')}
        onClose={() => setTransactionModalOpen(false)}
        footer={(
          <>
            <Button color="secondary" onClick={() => setTransactionModalOpen(false)}>{t('app.cancel')}</Button>
            <Button color="primary" onClick={() => void saveTransaction()} disabled={savingSection === 'transaction'}>
              {t('app.save')}
            </Button>
          </>
        )}
      >
        <Row className="g-2">
          <Col md="6"><Label className="fs-12">{t('insurance.production.application_date')}</Label><Input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.issue_date')}</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.delivery_date')}</Label><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.document-types.title')}</Label>
            <Input type="select" value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.documentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.production.production_type')}</Label>
            <Input type="select" value={productionTypeId} onChange={(e) => setProductionTypeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.productionTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Input>
          </Col>
          <Col md="6">
            <Label className="fs-12">{t('insurance.lookup.payment-frequencies.title')}</Label>
            <Input type="select" value={paymentFrequencyId} onChange={(e) => setPaymentFrequencyId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">-</option>
              {lookups.paymentFrequencies.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.value}</option>)}
            </Input>
          </Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.insurance_year')}</Label><Input value={insuranceYear} onChange={(e) => setInsuranceYear(e.target.value)} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.installment')}</Label><Input value={installmentNumber} onChange={(e) => setInstallmentNumber(e.target.value)} /></Col>
          <Col md="12"><Label className="fs-12">{t('insurance.field.remarks')}</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Col>
        </Row>
      </AppModal>

      <AppModal
        isOpen={financialModalOpen}
        title={t('insurance.production.financial')}
        onClose={() => setFinancialModalOpen(false)}
        footer={(
          <>
            <Button color="secondary" onClick={() => setFinancialModalOpen(false)}>{t('app.cancel')}</Button>
            <Button color="primary" onClick={() => void saveFinancial()} disabled={savingSection === 'financial'}>
              {t('app.save')}
            </Button>
          </>
        )}
      >
        <Row className="g-2">
          <Col md="6"><Label className="fs-12">{t('insurance.field.annual_net')}</Label><Input value={financial.annualNetAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, annualNetAmount: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.annual_gross')}</Label><Input value={financial.annualGrossAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, annualGrossAmount: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.installment_net')}</Label><Input value={financial.installmentNetAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, installmentNetAmount: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.installment_gross')}</Label><Input value={financial.installmentGrossAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, installmentGrossAmount: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.contract_rate')}</Label><Input value={financial.contractRate} onChange={(e) => setFinancial((prev) => ({ ...prev, contractRate: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.contract_commission')}</Label><Input value={financial.contractCommission} onChange={(e) => setFinancial((prev) => ({ ...prev, contractCommission: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.incoming_commission')}</Label><Input value={financial.incomingCommission} onChange={(e) => setFinancial((prev) => ({ ...prev, incomingCommission: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.performance_rate')}</Label><Input value={financial.performanceRate} onChange={(e) => setFinancial((prev) => ({ ...prev, performanceRate: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.performance_amount')}</Label><Input value={financial.performanceAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, performanceAmount: e.target.value }))} /></Col>
          <Col md="6"><Label className="fs-12">{t('insurance.field.difference')}</Label><Input value={financial.differenceAmount} onChange={(e) => setFinancial((prev) => ({ ...prev, differenceAmount: e.target.value }))} /></Col>
        </Row>
      </AppModal>
    </Row>
  );
}

export default InsuranceProductionDetailPage;
