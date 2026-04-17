import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Col, Input, Label, Row, Table } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createInsuranceCustomer,
  createLookupItem,
  deleteInsuranceCustomer,
  deleteLookupItem,
  fetchInsuranceCustomers,
  fetchInsuranceLookups,
  updateInsuranceCustomer,
  updateLookupItem,
} from '../../store/slices/insuranceSlice';
import type { LookupTypeKey } from '../../types/insurance';

type LookupConfig = {
  key: LookupTypeKey;
  title: string;
};

const lookupConfigs: LookupConfig[] = [
  { key: 'partners', title: 'Partners (Συνεργάτες)' },
  { key: 'companies', title: 'Insurance Companies (Εταιρείες)' },
  { key: 'branches', title: 'Insurance Branches (Κλάδοι)' },
  { key: 'contract-types', title: 'Contract Types (Συμβάσεις)' },
  { key: 'document-types', title: 'Document Types (Είδος Παραστατικού)' },
  { key: 'production-types', title: 'Production Types (Είδος Παραγωγής)' },
  { key: 'payment-frequencies', title: 'Payment Frequencies (Συχνότητα Πληρωμής)' },
];

function InsuranceOptionsPage() {
  const dispatch = useAppDispatch();
  const lookups = useAppSelector((state) => state.insurance.lookups);
  const customers = useAppSelector((state) => state.insurance.customers);

  const [lookupInput, setLookupInput] = useState<Record<string, string>>({});
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);

  useEffect(() => {
    void dispatch(fetchInsuranceLookups());
    void dispatch(fetchInsuranceCustomers());
  }, [dispatch]);

  const mapByKey = useMemo(
    () => ({
      partners: lookups.partners,
      companies: lookups.companies,
      branches: lookups.branches,
      'contract-types': lookups.contractTypes,
      'document-types': lookups.documentTypes,
      'production-types': lookups.productionTypes,
      'payment-frequencies': lookups.paymentFrequencies,
    }),
    [lookups]
  );

  const submitLookup = async (key: LookupTypeKey) => {
    const raw = (lookupInput[key] ?? '').trim();
    if (!raw) return;

    if (key === 'payment-frequencies') {
      const value = Number(raw);
      if (!Number.isInteger(value) || value <= 0) return;
      await dispatch(createLookupItem(key, { value, name: `Every ${value}` }));
    } else {
      await dispatch(createLookupItem(key, { name: raw }));
    }

    setLookupInput((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleLookupActive = async (key: LookupTypeKey, id: number, next: boolean) => {
    await dispatch(updateLookupItem(key, id, { isActive: next }));
  };

  const submitCustomer = async () => {
    if (!customerLastName.trim()) return;

    const payload = {
      lastName: customerLastName.trim(),
      firstName: customerFirstName.trim() || undefined,
      email: customerEmail.trim() || undefined,
      phone: customerPhone.trim() || undefined,
      mobilePhone: customerMobile.trim() || undefined,
    };

    if (editingCustomerId) {
      await dispatch(updateInsuranceCustomer(editingCustomerId, payload));
    } else {
      await dispatch(createInsuranceCustomer(payload));
    }

    setEditingCustomerId(null);
    setCustomerLastName('');
    setCustomerFirstName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerMobile('');
  };

  const startEditCustomer = (id: number) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    setEditingCustomerId(customer.id);
    setCustomerLastName(customer.lastName ?? '');
    setCustomerFirstName(customer.firstName ?? '');
    setCustomerEmail(customer.email ?? '');
    setCustomerPhone(customer.phone ?? '');
    setCustomerMobile(customer.mobilePhone ?? '');
  };

  return (
    <Row className="g-3">
      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <h5 className="mb-1">Insurance Options Setup</h5>
            <div className="text-muted fs-12">
              First setup lookup tables and customers, then use Production Management for full insurance rows.
            </div>
          </CardBody>
        </Card>
      </Col>

      {lookupConfigs.map((item) => (
        <Col lg="6" key={item.key}>
          <Card className="panel-card h-100">
            <CardBody>
              <h6>{item.title}</h6>

              <div className="d-flex gap-2 mb-2">
                <Input
                  value={lookupInput[item.key] ?? ''}
                  onChange={(e) => setLookupInput((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  placeholder={item.key === 'payment-frequencies' ? 'e.g. 1, 4, 12' : 'Enter name'}
                />
                <Button color="primary" outline onClick={() => void submitLookup(item.key)}>
                  Add
                </Button>
              </div>

              <div className="table-responsive">
                <Table size="sm" className="align-middle">
                  <thead>
                    <tr>
                      <th>Name/Value</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapByKey[item.key].map((row) => (
                      <tr key={row.id}>
                        <td>{item.key === 'payment-frequencies' ? row.value : row.name}</td>
                        <td>{row.isActive === false ? 'INACTIVE' : 'ACTIVE'}</td>
                        <td className="text-end d-flex gap-1 justify-content-end">
                          {item.key !== 'payment-frequencies' ? (
                            <Button
                              size="sm"
                              color="light"
                              onClick={() => void toggleLookupActive(item.key, row.id, row.isActive === false)}
                            >
                              Toggle
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            color="danger"
                            outline
                            onClick={() => void dispatch(deleteLookupItem(item.key, row.id))}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {mapByKey[item.key].length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-muted">
                          No data yet
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}

      <Col lg="12">
        <Card className="panel-card">
          <CardBody>
            <h6>Customers</h6>
            <Row className="g-2 mb-3">
              <Col md="2">
                <Label className="fs-12">Last name</Label>
                <Input value={customerLastName} onChange={(e) => setCustomerLastName(e.target.value)} />
              </Col>
              <Col md="2">
                <Label className="fs-12">First name</Label>
                <Input value={customerFirstName} onChange={(e) => setCustomerFirstName(e.target.value)} />
              </Col>
              <Col md="2">
                <Label className="fs-12">Email</Label>
                <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </Col>
              <Col md="2">
                <Label className="fs-12">Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </Col>
              <Col md="2">
                <Label className="fs-12">Mobile</Label>
                <Input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
              </Col>
              <Col md="2" className="d-flex align-items-end gap-2">
                <Button color="primary" onClick={() => void submitCustomer()}>
                  {editingCustomerId ? 'Update' : 'Create'}
                </Button>
                {editingCustomerId ? (
                  <Button
                    color="light"
                    onClick={() => {
                      setEditingCustomerId(null);
                      setCustomerLastName('');
                      setCustomerFirstName('');
                      setCustomerEmail('');
                      setCustomerPhone('');
                      setCustomerMobile('');
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </Col>
            </Row>

            <div className="table-responsive">
              <Table size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Mobile</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((row) => (
                    <tr key={row.id}>
                      <td>{row.lastName}</td>
                      <td>{row.firstName ?? '-'}</td>
                      <td>{row.email ?? '-'}</td>
                      <td>{row.phone ?? '-'}</td>
                      <td>{row.mobilePhone ?? '-'}</td>
                      <td className="text-end d-flex gap-1 justify-content-end">
                        <Button size="sm" color="light" onClick={() => startEditCustomer(row.id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          outline
                          onClick={() => void dispatch(deleteInsuranceCustomer(row.id))}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        No customers yet
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

export default InsuranceOptionsPage;
