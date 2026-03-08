import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, Col, ListGroup, ListGroupItem, Row, Spinner, Table } from 'reactstrap';
import api from '../../api/client';
import type { User } from '../../types/user';
import type { UserDetailsResponse } from '../../types/logs';

function SettingsUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const response = await api.get<User[]>('/users');
      setUsers(response.data);
      if (response.data.length > 0) {
        setSelectedUserId(response.data[0].id);
      }
    };

    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get<UserDetailsResponse>(`/users/${selectedUserId}/details`);
        setDetails(response.data);
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [selectedUserId]);

  return (
    <Row className="g-3">
      <Col lg="4">
        <Card className="panel-card">
          <CardBody>
            <h6>Users (Details View)</h6>
            <ListGroup flush>
              {users.map((user) => (
                <ListGroupItem
                  key={user.id}
                  tag="button"
                  action
                  active={user.id === selectedUserId}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  {user.name}
                  <div className="fs-12 text-muted">{user.email}</div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardBody>
        </Card>
      </Col>

      <Col lg="8">
        <Card className="panel-card mb-3">
          <CardBody>
            <h6>User Details</h6>
            {loading ? (
              <Spinner />
            ) : details ? (
              <div>
                <div>Name: {details.user.name}</div>
                <div>Email: {details.user.email}</div>
                <div>Keycloak ID: {details.user.keycloakId}</div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card className="panel-card mb-3">
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
                {(details?.authLogs ?? []).map((log) => (
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
                {(details?.apiLogs ?? []).map((log) => (
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
  );
}

export default SettingsUsersPage;
