import { Card, CardBody, Col, Row } from 'reactstrap';

function DashboardPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Dashboard</h3>
        <span className="badge text-bg-dark">Live</span>
      </div>

      <Row className="g-3">
        <Col lg="4" md="6">
          <Card className="panel-card panel-a">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">Requests Today</div>
              <h4 className="mt-2 mb-0">1,284</h4>
            </CardBody>
          </Card>
        </Col>
        <Col lg="4" md="6">
          <Card className="panel-card panel-b">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">Active Users</div>
              <h4 className="mt-2 mb-0">94</h4>
            </CardBody>
          </Card>
        </Col>
        <Col lg="4" md="12">
          <Card className="panel-card panel-c">
            <CardBody>
              <div className="fs-12 text-uppercase text-muted">Error Rate</div>
              <h4 className="mt-2 mb-0">0.3%</h4>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default DashboardPage;
