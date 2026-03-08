import { Button, Table } from 'reactstrap';
import type { User } from '../../types/user';

type ActionGridProps = {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
};

function ActionGrid({ users, onView, onEdit, onDelete }: ActionGridProps) {
  return (
    <Table responsive hover className="align-middle bg-white rounded-3 overflow-hidden">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Keycloak ID</th>
          <th>Created By</th>
          <th>Updated By</th>
          <th className="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>#{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td className="fs-12 text-muted">{user.keycloakId}</td>
            <td>{user.createdBy?.name ?? '-'}</td>
            <td>{user.updatedBy?.name ?? '-'}</td>
            <td className="text-end d-flex gap-2 justify-content-end">
              <Button size="sm" color="primary" outline onClick={() => onView(user)}>
                View
              </Button>
              <Button size="sm" color="dark" outline onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button size="sm" color="danger" outline onClick={() => onDelete(user.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default ActionGrid;
