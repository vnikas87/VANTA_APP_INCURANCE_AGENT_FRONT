import { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Input, Label, Row, Table } from 'reactstrap';
import AppModal from '../../components/common/AppModal';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createInsuranceCustomer,
  deleteInsuranceCustomer,
  fetchInsuranceCustomers,
  updateInsuranceCustomer,
} from '../../store/slices/insuranceSlice';

function InsuranceCustomersPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const customers = useAppSelector((state) => state.insurance.customers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');

  useEffect(() => {
    void dispatch(fetchInsuranceCustomers());
  }, [dispatch]);

  const openCreate = () => {
    setEditingId(null);
    setLastName('');
    setFirstName('');
    setEmail('');
    setPhone('');
    setMobilePhone('');
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setLastName(row.lastName ?? '');
    setFirstName(row.firstName ?? '');
    setEmail(row.email ?? '');
    setPhone(row.phone ?? '');
    setMobilePhone(row.mobilePhone ?? '');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!lastName.trim()) return;
    const payload = {
      lastName: lastName.trim(),
      firstName: firstName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      mobilePhone: mobilePhone.trim() || undefined,
    };

    if (editingId) {
      await dispatch(updateInsuranceCustomer(editingId, payload));
    } else {
      await dispatch(createInsuranceCustomer(payload));
    }
    setModalOpen(false);
  };

  return (
    <Row className="g-3">
      <Col lg="12">
        <Card className="panel-card">
          <CardBody className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{t('insurance.customers.title')}</h5>
              <div className="fs-12 text-muted">{t('insurance.customers.subtitle')}</div>
            </div>
            <Button color="primary" onClick={openCreate}>{t('insurance.customers.create')}</Button>
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
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Mobile</th>
                    <th className="text-end">{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.lastName}</td>
                      <td>{row.firstName ?? '-'}</td>
                      <td>{row.email ?? '-'}</td>
                      <td>{row.phone ?? '-'}</td>
                      <td>{row.mobilePhone ?? '-'}</td>
                      <td className="text-end d-flex justify-content-end gap-1">
                        <Button size="sm" color="light" onClick={() => openEdit(row)}>{t('app.edit')}</Button>
                        <Button size="sm" color="danger" outline onClick={() => void dispatch(deleteInsuranceCustomer(row.id))}>{t('app.delete')}</Button>
                      </td>
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
        title={editingId ? `${t('app.edit')} ${t('insurance.customers.title')}` : t('insurance.customers.create')}
        onClose={() => setModalOpen(false)}
        footer={<><Button color="secondary" onClick={() => setModalOpen(false)}>{t('app.cancel')}</Button><Button color="primary" onClick={() => void submit()}>{t('app.save')}</Button></>}
      >
        <Label className="fs-12">Last Name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Label className="fs-12 mt-2">First Name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Label className="fs-12 mt-2">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        <Label className="fs-12 mt-2">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Label className="fs-12 mt-2">Mobile Phone</Label>
        <Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} />
      </AppModal>
    </Row>
  );
}

export default InsuranceCustomersPage;
