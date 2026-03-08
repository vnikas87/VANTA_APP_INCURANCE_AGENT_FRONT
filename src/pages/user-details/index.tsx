import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, Col, Row, Spinner, Table } from 'reactstrap';
import api from '../../api/client';
import type { UserDetailsResponse } from '../../types/logs';

function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get<UserDetailsResponse>(`/users/${id}/details`);
        setDetails(response.data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  if (!details) {
    return <div>No user details found.</div>;
  }

  return (
    <>
      <Button color="secondary" outline className="mb-3" onClick={() => navigate('/settings/access-control/users')}>
        Back to Users
      </Button>
      <Row className="g-3">
        <Col lg="12">
          <Card className="panel-card">
            <CardBody>
              <h5>{details.user.name}</h5>
              <div className="text-muted">{details.user.email}</div>
              <div className="fs-12 mt-2">Keycloak ID: {details.user.keycloakId}</div>
            </CardBody>
          </Card>
        </Col>

        <Col lg="12">
          <Card className="panel-card">
            <CardBody>
              <h6>Login/Auth Events</h6>
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Event</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {details.authLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <Badge color="info">{log.eventType}</Badge>
                      </td>
                      <td>{log.sourcePath}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        <Col lg="12">
          <Card className="panel-card">
            <CardBody>
              <h6>Function/API Calls</h6>
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Method</th>
                    <th>Function</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.apiLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.calledAt).toLocaleString()}</td>
                      <td>{log.method}</td>
                      <td>{log.functionName}</td>
                      <td>{log.statusCode}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default UserDetailsPage;
