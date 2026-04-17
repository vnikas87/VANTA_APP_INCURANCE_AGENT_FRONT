import { Card, CardBody, Col, Row } from 'reactstrap';
import { useI18n } from '../../i18n';

function DashboardPage() {
  const { t } = useI18n();
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">{t('dashboard.title')}</h3>
        <span className="badge text-bg-dark">{t('dashboard.live')}</span>
      </div>

      <Row className="g-3">
        <Col lg="4" md="6">
          <Card className="panel-card panel-a">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">{t('dashboard.requests_today')}</div>
              <h4 className="mt-2 mb-0">1,284</h4>
            </CardBody>
          </Card>
        </Col>
        <Col lg="4" md="6">
          <Card className="panel-card panel-b">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">{t('dashboard.active_users')}</div>
              <h4 className="mt-2 mb-0">94</h4>
            </CardBody>
          </Card>
        </Col>
        <Col lg="4" md="12">
          <Card className="panel-card panel-c">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">{t('dashboard.error_rate')}</div>
              <h4 className="mt-2 mb-0">0.3%</h4>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default DashboardPage;
