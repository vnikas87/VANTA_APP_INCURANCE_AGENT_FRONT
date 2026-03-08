import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Card, CardBody, Col, Form, Input, Label, Row } from 'reactstrap';
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
            <Label className="fs-12">Upload image</Label>
            <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
            <div className="text-muted fs-12 mt-2">Max 5MB PNG/JPG/WEBP</div>
          </CardBody>
        </Card>
      </Col>

      <Col lg="8">
        <Card className="panel-card">
          <CardBody>
            <h5 className="mb-3">Personal Details</h5>
            <Form>
              <Row className="g-3">
                <Col md="6">
                  <Label className="fs-12">Full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Col>
                <Col md="6">
                  <Label className="fs-12">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Col>
                <Col md="6">
                  <Label className="fs-12">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 69..." />
                </Col>
                <Col md="6">
                  <Label className="fs-12">Role in company</Label>
                  <Input value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} placeholder="Founder" />
                </Col>
                <Col md="6">
                  <Label className="fs-12">Mobile phone</Label>
                  <Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} placeholder="+30 69..." />
                </Col>
                <Col md="12">
                  <Label className="fs-12">Signature</Label>
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
                Update Profile
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

export default SettingsPage;
