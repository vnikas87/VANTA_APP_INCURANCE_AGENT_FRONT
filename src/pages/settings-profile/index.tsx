import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Card, CardBody, Col, Form, Input, Label, Row } from 'reactstrap';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCurrentUser, updateMyProfile, uploadMyAvatar } from '../../store/slices/usersSlice';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function SettingsPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [signature, setSignature] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      void dispatch(fetchCurrentUser());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    setName(currentUser?.name ?? '');
    setEmail(currentUser?.email ?? '');
    setPhone(currentUser?.phone ?? '');
    setMobilePhone(currentUser?.mobilePhone ?? '');
    setCompanyRole(currentUser?.companyRole ?? '');
    setSignature(currentUser?.signature ?? '');
  }, [currentUser]);

  const onSave = async () => {
    await dispatch(
      updateMyProfile({
        name,
        email,
        phone,
        mobilePhone,
        companyRole,
        signature,
      })
    );
  };

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const dataUrl = await fileToDataUrl(file);
      await dispatch(uploadMyAvatar(dataUrl));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Row className="g-3">
      <Col lg="4">
        <Card className="panel-card">
          <CardBody className="text-center">
            <div className="profile-avatar-wrap mx-auto mb-3">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="avatar" className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">{(currentUser?.name ?? 'U').slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <Label className="fs-12">{t('profile.upload')}</Label>
            <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
            <div className="text-muted fs-12 mt-2">{t('profile.max_size')}</div>
          </CardBody>
        </Card>
      </Col>

      <Col lg="8">
        <Card className="panel-card">
          <CardBody>
            <h5 className="mb-3">{t('profile.title')}</h5>
            <Form>
              <Row className="g-3">
                <Col md="6">
                  <Label className="fs-12">{t('profile.full_name')}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Col>
                <Col md="6">
                  <Label className="fs-12">{t('users.email')}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Col>
                <Col md="6">
                  <Label className="fs-12">{t('profile.phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 69..." />
                </Col>
                <Col md="6">
                  <Label className="fs-12">{t('profile.role_company')}</Label>
                  <Input value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} placeholder="Founder" />
                </Col>
                <Col md="6">
                  <Label className="fs-12">{t('profile.mobile')}</Label>
                  <Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} placeholder="+30 69..." />
                </Col>
                <Col md="12">
                  <Label className="fs-12">{t('profile.signature')}</Label>
                  <Input
                    type="textarea"
                    rows={4}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Add your signature or short profile text"
                  />
                </Col>
              </Row>

              <Button type="button" color="primary" className="mt-3" onClick={() => void onSave()}>
                {t('profile.update')}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

export default SettingsPage;
