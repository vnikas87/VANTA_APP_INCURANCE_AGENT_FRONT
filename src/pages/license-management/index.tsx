import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Badge, Button, Card, CardBody, Col, Form, Input, Label, Row } from 'reactstrap';
import { useI18n } from '../../i18n';
import { sweetAlert, toastError } from '../../utils/alerts';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUsers } from '../../store/slices/usersSlice';
import {
  activateLicenseByCode,
  deactivateCurrentLicense,
  fetchLicenseAdminData,
  setUserLicenseSeat,
} from '../../store/slices/licenseSlice';

function LicenseManagementPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.license.data);
  const loading = useAppSelector((state) => state.license.loading);
  const users = useAppSelector((state) => state.users.items);
  const [licenseCode, setLicenseCode] = useState('');
  const [assignUserId, setAssignUserId] = useState<number | ''>('');

  useEffect(() => {
    void dispatch(fetchLicenseAdminData());
    void dispatch(fetchUsers());
  }, [dispatch]);

  const submitLicenseCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!licenseCode.trim()) return;
    await dispatch(activateLicenseByCode(licenseCode.trim()));
    setLicenseCode('');
  };

  const deactivateLicense = async () => {
    const ok = await sweetAlert();
    if (!ok) return;
    await dispatch(deactivateCurrentLicense());
  };

  const assignSeatToUser = async () => {
    if (!assignUserId) {
      toastError('Select a user first');
      return;
    }
    if (!data?.license.isActive) {
      toastError('License is inactive. Activate a license first');
      return;
    }
    if (data.usage.availableSeats <= 0) {
      toastError('No available seats. Increase your license seats first');
      return;
    }

    await dispatch(setUserLicenseSeat(Number(assignUserId), true, 'Seat assigned from license page'));
    setAssignUserId('');
    await dispatch(fetchUsers());
  };

  const activeSeatUserIds = new Set((data?.seats ?? []).filter((s) => s.isActive).map((s) => s.userId));
  const assignableUsers = users.filter((user) => !activeSeatUserIds.has(user.id));
  const activeGrant = (data?.grants ?? []).find((grant) => grant.isActive) ?? null;
  const assignDisabled = !assignUserId || !data?.license.isActive || (data?.usage.availableSeats ?? 0) <= 0;

  return (
    <Row className="g-3">
      <Col lg="4">
        <Card className="panel-card">
          <CardBody>
            <h6 className="mb-2">{t('license.title')}</h6>
            {!data ? (
              <div className="text-muted fs-12">{t('app.loading')}</div>
            ) : (
              <div className="fs-12 d-flex flex-column gap-1">
                <div>
                  {t('app.status')}:{' '}
                  <Badge color={data.license.isActive ? 'success' : 'secondary'}>
                    {data.license.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <div>
                  {t('license.seats')}: <strong>{data.usage.usedUsers}</strong> / <strong>{data.license.maxUsers}</strong>
                </div>
                <div>
                  {t('license.available')}: <strong>{data.usage.availableSeats}</strong>
                </div>
                <div>
                  {t('license.tenant')}: <strong>{data.license.tenantCode ?? '-'}</strong>
                </div>
                <div>
                  {t('license.expires')}: <strong>{data.license.expiresAt ? new Date(data.license.expiresAt).toLocaleString() : t('license.no_expiry')}</strong>
                </div>
                <div>
                  {t('license.active_token')}: <strong>{activeGrant?.tokenId ?? data.license.licenseTokenId ?? '-'}</strong>
                </div>
                <div>
                  {t('license.issued_to')}: <strong>{activeGrant?.issuedTo ?? '-'}</strong>
                </div>
                <div>
                  {t('license.activated_at')}:{' '}
                  <strong>{activeGrant?.activatedAt ? new Date(activeGrant.activatedAt).toLocaleString() : '-'}</strong>
                </div>
              </div>
            )}

            <hr />
            <Form onSubmit={submitLicenseCode}>
              <Label className="fs-12">{t('license.activate_code')}</Label>
              <Input
                type="textarea"
                rows={5}
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder={t('license.paste_code')}
              />
              <Button className="mt-2" color="primary" type="submit" size="sm" disabled={loading}>
                {t('license.activate')}
              </Button>
              <Button
                className="mt-2 ms-2"
                color="danger"
                outline
                type="button"
                onClick={() => void deactivateLicense()}
                disabled={loading}
              >
                {t('license.deactivate')}
              </Button>
              <Button
                className="mt-2 ms-2"
                color="light"
                type="button"
                size="sm"
                onClick={() => void dispatch(fetchLicenseAdminData())}
                disabled={loading}
              >
                {t('license.refresh')}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Col>

      <Col lg="8">
        <Card className="panel-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="m-0">{t('license.allocated')}</h6>
              <small className="text-muted">{t('license.assign_seat')}</small>
            </div>
            <div className="d-flex gap-2 align-items-end mb-3">
              <div style={{ minWidth: 320 }}>
                <Label className="fs-12">{t('license.assign_seat')}</Label>
                <Input
                  type="select"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">{t('license.select_user')}</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      #{user.id} {user.name} ({user.email})
                    </option>
                  ))}
                </Input>
                <div className="text-muted fs-12 mt-1">
                  Only users in local DB are listed. If missing, user must login once first.
                </div>
              </div>
              <Button
                type="button"
                color="primary"
                outline
                disabled={assignDisabled}
                onClick={() => void assignSeatToUser()}
              >
                {t('license.assign_button')}
              </Button>
              <Button
                type="button"
                color="light"
                outline
                onClick={() => void dispatch(fetchUsers())}
              >
                {t('license.refresh_users')}
              </Button>
              <Badge color="info" className="p-2">
                {t('license.available')}: {data?.usage.availableSeats ?? 0}
              </Badge>
            </div>
            {!data ? (
              <div className="text-muted fs-12">{t('app.loading')}</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>{t('app.status')}</th>
                      <th className="text-end">{t('app.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.seats.map((seat) => (
                      <tr key={seat.id}>
                        <td>
                          {seat.user.name} <span className="text-muted fs-12">#{seat.userId}</span>
                        </td>
                        <td>{seat.user.email}</td>
                        <td>
                          <Badge color={seat.isActive ? 'success' : 'secondary'}>
                            {seat.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {seat.isActive ? (
                            <Button
                              size="sm"
                              color="danger"
                              outline
                              type="button"
                              onClick={() =>
                                void dispatch(setUserLicenseSeat(seat.userId, false, 'Seat deactivated by administrator'))
                              }
                            >
                              {t('license.deactivate')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              color="success"
                              outline
                              type="button"
                              onClick={() =>
                                void dispatch(setUserLicenseSeat(seat.userId, true, 'Seat activated by administrator'))
                              }
                            >
                              {t('license.activate')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.seats.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-muted">
                          {t('license.no_seats')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

export default LicenseManagementPage;
