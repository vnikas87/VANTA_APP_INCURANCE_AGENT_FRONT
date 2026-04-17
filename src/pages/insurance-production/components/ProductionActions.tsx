import { Button, Card, CardBody, Col, Input, Label, Row } from 'reactstrap';
import AppModal from '../../../components/common/AppModal';

type ProductionActionsProps = {
  title: string;
  subtitle: string;
  quickCreateLabel: string;
  modalOpen: boolean;
  saving: boolean;
  selectedCustomerId: number | '';
  selectedPolicyId: number | '';
  policyNumber: string;
  applicationDate: string;
  productionTypeId: number | '';
  customerOptions: Array<{ value: number; label: string }>;
  policyOptions: Array<{ value: number; label: string }>;
  productionTypeOptions: Array<{ value: number; label: string }>;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onCreate: () => void;
  onSelectedCustomerChange: (value: number | '') => void;
  onSelectedPolicyChange: (value: number | '') => void;
  onPolicyNumberChange: (value: string) => void;
  onApplicationDateChange: (value: string) => void;
  onProductionTypeChange: (value: number | '') => void;
  customersLabel: string;
  existingPolicyLabel: string;
  createNewPolicyLabel: string;
  policyNumberLabel: string;
  applicationDateLabel: string;
  productionTypeLabel: string;
  selectUserLabel: string;
  cancelLabel: string;
  createLabel: string;
};

function ProductionActions(props: ProductionActionsProps) {
  const {
    title,
    subtitle,
    quickCreateLabel,
    modalOpen,
    saving,
    selectedCustomerId,
    selectedPolicyId,
    policyNumber,
    applicationDate,
    productionTypeId,
    customerOptions,
    policyOptions,
    productionTypeOptions,
    onOpenModal,
    onCloseModal,
    onCreate,
    onSelectedCustomerChange,
    onSelectedPolicyChange,
    onPolicyNumberChange,
    onApplicationDateChange,
    onProductionTypeChange,
    customersLabel,
    existingPolicyLabel,
    createNewPolicyLabel,
    policyNumberLabel,
    applicationDateLabel,
    productionTypeLabel,
    selectUserLabel,
    cancelLabel,
    createLabel,
  } = props;

  return (
    <>
      <Col lg="12">
        <Card className="panel-card">
          <CardBody className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{title}</h5>
              <div className="text-muted fs-12">{subtitle}</div>
            </div>
            <Button color="primary" onClick={onOpenModal}>
              {quickCreateLabel}
            </Button>
          </CardBody>
        </Card>
      </Col>

      <AppModal
        isOpen={modalOpen}
        title={quickCreateLabel}
        onClose={onCloseModal}
        footer={(
          <>
            <Button color="secondary" onClick={onCloseModal}>
              {cancelLabel}
            </Button>
            <Button color="primary" onClick={onCreate} disabled={saving}>
              {createLabel}
            </Button>
          </>
        )}
      >
        <Row className="g-2">
          <Col md="12">
            <Label className="fs-12">{customersLabel}</Label>
            <Input
              type="select"
              value={selectedCustomerId}
              onChange={(e) => onSelectedCustomerChange(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">{selectUserLabel}</option>
              {customerOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Input>
          </Col>
          <Col md="12">
            <Label className="fs-12">{existingPolicyLabel}</Label>
            <Input
              type="select"
              value={selectedPolicyId}
              onChange={(e) => onSelectedPolicyChange(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">{createNewPolicyLabel}</option>
              {policyOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Input>
          </Col>
          <Col md="12">
            <Label className="fs-12">{policyNumberLabel}</Label>
            <Input
              value={policyNumber}
              onChange={(e) => onPolicyNumberChange(e.target.value)}
              disabled={Boolean(selectedPolicyId)}
            />
          </Col>
          <Col md="12">
            <Label className="fs-12">{applicationDateLabel}</Label>
            <Input
              type="date"
              value={applicationDate}
              onChange={(e) => onApplicationDateChange(e.target.value)}
            />
          </Col>
          <Col md="12">
            <Label className="fs-12">{productionTypeLabel}</Label>
            <Input
              type="select"
              value={productionTypeId}
              onChange={(e) => onProductionTypeChange(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">-</option>
              {productionTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Input>
          </Col>
        </Row>
      </AppModal>
    </>
  );
}

export default ProductionActions;
