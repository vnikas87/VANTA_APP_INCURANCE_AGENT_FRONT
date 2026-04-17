import { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Input, Label, Row, Table } from 'reactstrap';
import AppModal from '../../components/common/AppModal';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createInsurancePolicy,
  fetchInsuranceCustomers,
  fetchInsuranceLookups,
  fetchInsurancePolicies,
} from '../../store/slices/insuranceSlice';

function InsurancePoliciesPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const policies = useAppSelector((state) => state.insurance.policies);
  const customers = useAppSelector((state) => state.insurance.customers);
  const lookups = useAppSelector((state) => state.insurance.lookups);

  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [contractTypeId, setContractTypeId] = useState<number | ''>('');

  useEffect(() => {
    void dispatch(fetchInsuranceCustomers());
    void dispatch(fetchInsuranceLookups());
    void dispatch(fetchInsurancePolicies());
  }, [dispatch]);

  const submit = async () => {
    if (!customerId || !policyNumber.trim()) return;
    await dispatch(
      createInsurancePolicy({
        customerId,
        policyNumber: policyNumber.trim(),
        identifier: identifier.trim() || undefined,
        partnerId: partnerId || undefined,
        companyId: companyId || undefined,
        branchId: branchId || undefined,
        contractTypeId: contractTypeId || undefined,
      })
    );
    setModalOpen(false);
  };

  return (
    <Row className="g-3">
      <Col lg="12">
        <Card className="panel-card">
          <CardBody className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{t('insurance.policies.title')}</h5>
              <div className="fs-12 text-muted">{t('insurance.policies.subtitle')}</div>
            </div>
            <Button color="primary" onClick={() => setModalOpen(true)}>{t('insurance.policies.create')}</Button>
          </CardBody>
        </Card>
      </Col>

      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <div className="table-responsive">
              <Table size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Policy Number</th>
                    <th>Identifier</th>
                    <th>Customer</th>
                    <th>Company</th>
                    <th>Branch</th>
                    <th>Partner</th>
                    <th>Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.policyNumber ?? '-'}</td>
                      <td>{row.identifier ?? '-'}</td>
                      <td>{row.customer.lastName} {row.customer.firstName ?? ''}</td>
                      <td>{row.company?.name ?? '-'}</td>
                      <td>{row.branch?.name ?? '-'}</td>
                      <td>{row.partner?.name ?? '-'}</td>
                      <td>{row.contractType?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Col>

      <AppModal
        isOpen={modalOpen}
        title={t('insurance.policies.create')}
        onClose={() => setModalOpen(false)}
        footer={<><Button color="secondary" onClick={() => setModalOpen(false)}>{t('app.cancel')}</Button><Button color="primary" onClick={() => void submit()}>{t('app.save')}</Button></>}
      >
        <Label className="fs-12">Customer</Label>
        <Input type="select" value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select customer</option>
          {customers.map((x) => (
            <option key={x.id} value={x.id}>{x.lastName} {x.firstName ?? ''}</option>
          ))}
        </Input>
        <Label className="fs-12 mt-2">Policy Number</Label>
        <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
        <Label className="fs-12 mt-2">Identifier</Label>
        <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        <Label className="fs-12 mt-2">Partner</Label>
        <Input type="select" value={partnerId} onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-</option>
          {lookups.partners.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Input>
        <Label className="fs-12 mt-2">Company</Label>
        <Input type="select" value={companyId} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-</option>
          {lookups.companies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Input>
        <Label className="fs-12 mt-2">Branch</Label>
        <Input type="select" value={branchId} onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-</option>
          {lookups.branches.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Input>
        <Label className="fs-12 mt-2">Contract Type</Label>
        <Input type="select" value={contractTypeId} onChange={(e) => setContractTypeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-</option>
          {lookups.contractTypes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Input>
      </AppModal>
    </Row>
  );
}

export default InsurancePoliciesPage;
