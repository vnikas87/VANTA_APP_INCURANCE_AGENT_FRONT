import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Col, Input, Label, Row, Table } from 'reactstrap';
import AppModal from '../../components/common/AppModal';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createLookupItem, deleteLookupItem, fetchInsuranceLookups, updateLookupItem } from '../../store/slices/insuranceSlice';
import type { LookupTypeKey } from '../../types/insurance';

type LookupConfig = { key: LookupTypeKey; paymentMode?: boolean };

const lookupConfigs: LookupConfig[] = [
  { key: 'partners' },
  { key: 'companies' },
  { key: 'branches' },
  { key: 'contract-types' },
  { key: 'document-types' },
  { key: 'production-types' },
  { key: 'payment-frequencies', paymentMode: true },
];

type InsuranceLookupsPageProps = {
  lookupKey?: LookupTypeKey;
};

function InsuranceLookupsPage({ lookupKey }: InsuranceLookupsPageProps) {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const lookups = useAppSelector((state) => state.insurance.lookups);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    void dispatch(fetchInsuranceLookups());
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

  const activeLookupKey = lookupKey ?? 'partners';
  const activeConfig = lookupConfigs.find((x) => x.key === activeLookupKey)!;
  const rows = mapByKey[activeLookupKey];
  const lookupTitleKey = `insurance.lookup.${activeLookupKey}.title`;
  const lookupDescKey = `insurance.lookup.${activeLookupKey}.subtitle`;

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setValue('');
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setName(row.name ?? '');
    setCode(row.code ?? '');
    setValue(row.value ? String(row.value) : '');
    setModalOpen(true);
  };

  const submit = async () => {
    if (activeConfig.paymentMode) {
      const numericValue = Number(value);
      if (!Number.isInteger(numericValue) || numericValue <= 0) return;
      const payload = { value: numericValue, name: name || `Every ${numericValue}` };
      if (editingId) {
        await dispatch(updateLookupItem(activeLookupKey, editingId, payload));
      } else {
        await dispatch(createLookupItem(activeLookupKey, payload));
      }
    } else {
      if (!name.trim()) return;
      const payload = { name: name.trim(), code: code.trim() || undefined };
      if (editingId) {
        await dispatch(updateLookupItem(activeLookupKey, editingId, payload));
      } else {
        await dispatch(createLookupItem(activeLookupKey, payload));
      }
    }
    setModalOpen(false);
  };

  return (
    <Row className="g-3">
      <Col lg="12">
        <Card className="panel-card">
          <CardBody className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{t(lookupTitleKey)}</h5>
              <div className="fs-12 text-muted">{t(lookupDescKey)}</div>
            </div>
            <Button color="primary" onClick={openCreate}>{t('app.create')}</Button>
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
                    <th>{t('app.id')}</th>
                    <th>{activeConfig.paymentMode ? t('app.value') : t('app.name')}</th>
                    <th>{t('app.code')}</th>
                    <th>{t('app.status')}</th>
                    <th className="text-end">{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{activeConfig.paymentMode ? row.value : row.name}</td>
                      <td>{row.code ?? '-'}</td>
                      <td>{row.isActive === false ? t('app.inactive') : t('app.active')}</td>
                      <td className="text-end d-flex justify-content-end gap-1">
                        <Button size="sm" color="light" onClick={() => openEdit(row)}>{t('app.edit')}</Button>
                        <Button size="sm" color="danger" outline onClick={() => void dispatch(deleteLookupItem(activeLookupKey, row.id))}>{t('app.delete')}</Button>
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
        title={`${editingId ? t('app.edit') : t('app.create')} ${t(lookupTitleKey)}`}
        onClose={() => setModalOpen(false)}
        footer={<><Button color="secondary" onClick={() => setModalOpen(false)}>{t('app.cancel')}</Button><Button color="primary" onClick={() => void submit()}>{t('app.save')}</Button></>}
      >
        {activeConfig.paymentMode ? (
          <div>
            <Label className="fs-12">{t('app.value')}</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('insurance.lookup.payment-frequencies.value_hint')}
            />
            <Label className="fs-12 mt-2">{t('insurance.lookup.payment-frequencies.optional_name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('insurance.lookup.payment-frequencies.name_hint')}
            />
          </div>
        ) : (
          <div>
            <Label className="fs-12">{t('app.name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Label className="fs-12 mt-2">{t('app.code')}</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        )}
      </AppModal>
    </Row>
  );
}

export default InsuranceLookupsPage;
