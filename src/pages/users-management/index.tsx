import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Col, Form, Input, Label, Row, Spinner } from 'reactstrap';
import { useI18n } from '../../i18n';
import ActionGrid from './components/grid';
import AppModal from './components/modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createUser, deleteUserWithConfirm, fetchUsers, updateUser } from '../../store/slices/usersSlice';
import type { User } from '../../types/user';
import { toastError, toastSuccess } from '../../utils/alerts';

type FormState = {
  keycloakId: string;
  name: string;
  email: string;
};

const initialFormState: FormState = {
  keycloakId: '',
  name: '',
  email: '',
};

function UsersPage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useAppSelector((state) => state.users);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const modalTitle = useMemo(() => (editingUser ? t('users.update') : t('users.create')), [editingUser, t]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      keycloakId: user.keycloakId,
      name: user.name,
      email: user.email,
    });
    setModalOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editingUser) {
        await dispatch(
          updateUser({
            id: editingUser.id,
            payload: {
              keycloakId: form.keycloakId,
              name: form.name,
              email: form.email,
            },
          })
        ).unwrap();
        toastSuccess('User updated successfully');
      } else {
        await dispatch(createUser(form)).unwrap();
        toastSuccess('User created successfully');
      }

      setModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save user';
      toastError(message);
    }
  };

  const handleDelete = async (userId: number) => {
    await dispatch(deleteUserWithConfirm(userId));
  };

  return (
    <>
      <Row className="g-3 mb-3">
        <Col lg="12">
          <Card className="panel-card">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{t('users.title')}</h5>
                <div className="fs-12 text-muted">{t('users.subtitle')}</div>
              </div>
              <Button color="primary" onClick={openCreate}>
                {t('users.create')}
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg="12">
          <Card className="panel-card">
            <CardBody>
              {loading ? (
                <Spinner />
              ) : (
                <ActionGrid
                  users={items}
                  onView={(user) => navigate(`/management/users/${user.id}`)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
              {error ? <div className="text-danger mt-2">{error}</div> : null}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <AppModal
        isOpen={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button color="secondary" onClick={() => setModalOpen(false)}>
              {t('app.cancel')}
            </Button>
            <Button color="primary" form="user-form" type="submit">
              {t('app.save')}
            </Button>
          </>
        }
      >
        <Form id="user-form" onSubmit={onSubmit}>
          <div className="mb-3">
            <Label className="form-label fs-12">{t('users.keycloak_id')}</Label>
            <Input
              value={form.keycloakId}
              onChange={(e) => setForm((prev) => ({ ...prev, keycloakId: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <Label className="form-label fs-12">{t('users.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label className="form-label fs-12">{t('users.email')}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </Form>
      </AppModal>
    </>
  );
}

export default UsersPage;
