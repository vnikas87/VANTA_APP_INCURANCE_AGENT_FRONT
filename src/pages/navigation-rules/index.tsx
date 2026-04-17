import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Form,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  bulkDeleteNavigationRules,
  bulkSetNavigationRulesAccess,
  bulkUpsertNavigationRules,
  createNavigationFolder,
  createNavigationGroup,
  createNavigationRule,
  createNavigationSubFolder,
  deleteNavigationFolder,
  deleteNavigationGroup,
  deleteNavigationRule,
  deleteNavigationSubFolder,
  fetchNavigationAdminTree,
  fetchNavigationRoles,
  moveNavigationFolder,
  moveNavigationSubFolder,
  updateNavigationGroup,
  updateNavigationRule,
  updateNavigationSubFolder,
  updateNavigationFolder,
} from '../../store/slices/navigationSlice';
import type { NavigationFolder, NavigationGroup, NavigationRule } from '../../types/navigation';
import { getUserRoles } from '../../auth/keycloak';
import { toastError } from '../../utils/alerts';

type EditModalState =
  | { open: false }
  | { open: true; kind: 'group'; id: number; name: string }
  | { open: true; kind: 'folder'; id: number; groupId: number; name: string }
  | { open: true; kind: 'subFolder'; id: number; folderId: number; name: string; path: string }
  | { open: true; kind: 'rule'; id: number; subFolderId: number; roleName: string; canAccess: boolean };

type MoveModalState =
  | { open: false }
  | { open: true; kind: 'folder'; id: number; targetGroupId: number; targetIndex: number }
  | { open: true; kind: 'subFolder'; id: number; targetFolderId: number; targetIndex: number };

const KEYCLOAK_COMPATIBLE_ROLES = ['ADMINISTRATOR', 'OPS_USER'] as const;
const ADMIN_ONLY_PATH_PREFIXES = ['/settings/access-control', '/management/users'];

function isAdminOnlyPath(path: string): boolean {
  return ADMIN_ONLY_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function NavigationRulesPage() {
  const dispatch = useAppDispatch();
  const adminTree = useAppSelector((state) => state.navigation.adminTree);
  const navRoles = useAppSelector((state) => state.navigation.navRoles);
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const sessionRoles = useMemo(() => getUserRoles(), []);
  const supportedRoleSet = useMemo(() => new Set(KEYCLOAK_COMPATIBLE_ROLES), []);
  const availableRoleNames = useMemo(() => {
    const normalized = navRoles.map((role) => role.name.toUpperCase().trim()).filter((name) => supportedRoleSet.has(name as (typeof KEYCLOAK_COMPATIBLE_ROLES)[number]));
    const withDefaults = new Set<string>([...KEYCLOAK_COMPATIBLE_ROLES, ...normalized]);
    return Array.from(withDefaults);
  }, [navRoles, supportedRoleSet]);
  const sessionSupportedRoles = useMemo(
    () => sessionRoles.filter((role) => supportedRoleSet.has(role as (typeof KEYCLOAK_COMPATIBLE_ROLES)[number])),
    [sessionRoles, supportedRoleSet]
  );

  const [groupName, setGroupName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [subFolderName, setSubFolderName] = useState('');
  const [subFolderPath, setSubFolderPath] = useState('');
  const [pathPreset, setPathPreset] = useState('/settings/access-control/users');
  const [roleName, setRoleName] = useState<string>('');
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [focusMode, setFocusMode] = useState(true);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [folderId, setFolderId] = useState<number | ''>('');
  const [ruleFolderId, setRuleFolderId] = useState<number | ''>('');
  const [subFolderId, setSubFolderId] = useState<number | ''>('');
  const [canAccess, setCanAccess] = useState(true);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [editModal, setEditModal] = useState<EditModalState>({ open: false });
  const [moveModal, setMoveModal] = useState<MoveModalState>({ open: false });

  useEffect(() => {
    void dispatch(fetchNavigationAdminTree());
    void dispatch(fetchNavigationRoles());
  }, [dispatch]);

  const folders = useMemo(() => adminTree.flatMap((group) => group.folders), [adminTree]);
  const groupFolders = useMemo(() => {
    if (!groupId) return [];
    const selectedGroup = adminTree.find((group) => group.id === Number(groupId));
    return selectedGroup?.folders ?? [];
  }, [adminTree, groupId]);
  const ruleSubFolders = useMemo(() => {
    if (!ruleFolderId) return [];
    const selectedFolder = folders.find((folder) => folder.id === Number(ruleFolderId));
    return selectedFolder?.subFolders ?? [];
  }, [folders, ruleFolderId]);
  const selectedRuleSubFolder = useMemo(
    () => ruleSubFolders.find((item) => item.id === Number(subFolderId)),
    [ruleSubFolders, subFolderId]
  );

  useEffect(() => {
    if (!roleName && availableRoleNames[0]) {
      setRoleName(availableRoleNames[0]);
    }
    if (selectedRoleNames.length === 0 && availableRoleNames[0]) {
      setSelectedRoleNames([availableRoleNames[0]]);
    }
  }, [roleName, selectedRoleNames.length, availableRoleNames]);

  useEffect(() => {
    setSelectedRuleIds((prev) => prev.filter((id) => adminTree.some((g) => g.folders.some((f) => f.subFolders.some((s) => s.rules.some((r) => r.id === id))))));
  }, [adminTree]);

  useEffect(() => {
    if (!folderId) return;
    setRuleFolderId(Number(folderId));
  }, [folderId]);

  const toggleExpanded = (key: string) => {
    setExpandedMap((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const isExpanded = (key: string) => expandedMap[key] ?? true;

  const submitGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupName) return;
    await dispatch(createNavigationGroup({ name: groupName }));
    setGroupName('');
    setWizardStep(2);
  };

  const submitFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!folderName || !groupId) return;
    await dispatch(createNavigationFolder({ groupId: Number(groupId), name: folderName }));
    setFolderName('');
    setWizardStep(3);
  };

  const submitSubFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!subFolderName || !subFolderPath || !folderId) return;
    await dispatch(
      createNavigationSubFolder({
        folderId: Number(folderId),
        name: subFolderName,
        path: subFolderPath,
      })
    );
    setSubFolderName('');
    setSubFolderPath('');
    setWizardStep(4);
  };

  const submitRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!ruleFolderId || !subFolderId) return;
    if (!selectedRuleSubFolder) return;

    const normalizedSelectedRoles = selectedRoleNames
      .map((role) => role.toUpperCase().trim())
      .filter((role) => availableRoleNames.includes(role));

    if (normalizedSelectedRoles.length > 0) {
      if (isAdminOnlyPath(selectedRuleSubFolder.path) && normalizedSelectedRoles.includes('OPS_USER')) {
        toastError('OPS_USER cannot be assigned to admin-only paths (/settings/access-control*, /management/users*)');
        return;
      }
      await dispatch(
        bulkUpsertNavigationRules({
          subFolderId: Number(subFolderId),
          roleNames: normalizedSelectedRoles,
          canAccess,
        })
      );
      setWizardStep(4);
      return;
    }

    if (!roleName) return;
    const normalizedRoleName = roleName.toUpperCase().trim();
    if (!availableRoleNames.includes(normalizedRoleName)) {
      toastError('Invalid role. Only ADMINISTRATOR and OPS_USER are supported.');
      return;
    }
    if (isAdminOnlyPath(selectedRuleSubFolder.path) && normalizedRoleName === 'OPS_USER') {
      toastError('OPS_USER cannot be assigned to admin-only paths (/settings/access-control*, /management/users*)');
      return;
    }
    await dispatch(
      createNavigationRule({
        subFolderId: Number(subFolderId),
        roleName: normalizedRoleName,
        canAccess,
      })
    );
    setWizardStep(4);
  };

  const toggleRole = (value: string) => {
    setSelectedRoleNames((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleRuleSelection = (id: number) => {
    setSelectedRuleIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAllRulesInSubFolder = (rules: NavigationRule[]) => {
    const ids = rules.map((rule) => rule.id);
    setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearRulesInSubFolder = (rules: NavigationRule[]) => {
    const ids = new Set(rules.map((rule) => rule.id));
    setSelectedRuleIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const selectedIdsInSubFolder = (rules: NavigationRule[]): number[] =>
    rules.filter((rule) => selectedRuleIds.includes(rule.id)).map((rule) => rule.id);

  const setSelectedInSubFolderAccess = async (rules: NavigationRule[], canAccessValue: boolean) => {
    const ids = selectedIdsInSubFolder(rules);
    if (ids.length === 0) return;
    await dispatch(bulkSetNavigationRulesAccess({ ids, canAccess: canAccessValue }));
  };

  const removeSelectedInSubFolder = async (rules: NavigationRule[]) => {
    const ids = selectedIdsInSubFolder(rules);
    if (ids.length === 0) return;
    await dispatch(bulkDeleteNavigationRules({ ids, confirm: false }));
  };

  const bulkRemoveSelectedRoles = async () => {
    if (!selectedRuleSubFolder) return;
    const roleSet = new Set(
      selectedRoleNames
        .map((role) => role.trim().toUpperCase())
        .filter((role) => role && availableRoleNames.includes(role))
    );
    if (roleSet.size === 0) return;
    const ids = selectedRuleSubFolder.rules
      .filter((rule) => roleSet.has(rule.roleName.toUpperCase()))
      .map((rule) => rule.id);
    if (ids.length === 0) return;
    await dispatch(bulkDeleteNavigationRules({ ids, confirm: false }));
  };

  const setAllExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    for (const group of adminTree) {
      next[`group-${group.id}`] = expanded;
      for (const folder of group.folders) {
        next[`folder-${folder.id}`] = expanded;
        for (const subFolder of folder.subFolders) {
          next[`sub-${subFolder.id}`] = expanded;
        }
      }
    }
    setExpandedMap(next);
  };

  const moveGroupBy = async (groupIdValue: number, direction: -1 | 1) => {
    const index = adminTree.findIndex((g) => g.id === groupIdValue);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= adminTree.length) return;

    const current = adminTree[index];
    const target = adminTree[targetIndex];

    await Promise.all([
      dispatch(updateNavigationGroup(current.id, { sortOrder: targetIndex })),
      dispatch(updateNavigationGroup(target.id, { sortOrder: index })),
    ]);
  };

  const moveFolderBy = async (group: NavigationGroup, folder: NavigationFolder, direction: -1 | 1) => {
    const index = group.folders.findIndex((item) => item.id === folder.id);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= group.folders.length) return;

    await dispatch(
      moveNavigationFolder(folder.id, {
        targetGroupId: group.id,
        targetIndex,
      })
    );
  };

  const moveSubFolderBy = async (folder: NavigationFolder, subFolderIdValue: number, direction: -1 | 1) => {
    const index = folder.subFolders.findIndex((item) => item.id === subFolderIdValue);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= folder.subFolders.length) return;

    await dispatch(
      moveNavigationSubFolder(subFolderIdValue, {
        targetFolderId: folder.id,
        targetIndex,
      })
    );
  };

  const saveEdit = async () => {
    if (!editModal.open) return;

    if (editModal.kind === 'group') {
      if (!editModal.name.trim()) return;
      await dispatch(updateNavigationGroup(editModal.id, { name: editModal.name.trim() }));
      setEditModal({ open: false });
      return;
    }

    if (editModal.kind === 'folder') {
      if (!editModal.name.trim()) return;
      await dispatch(
        updateNavigationFolder(editModal.id, {
          groupId: editModal.groupId,
          name: editModal.name.trim(),
        })
      );
      setEditModal({ open: false });
      return;
    }

    if (editModal.kind === 'subFolder') {
      if (!editModal.name.trim() || !editModal.path.trim()) return;
      await dispatch(
        updateNavigationSubFolder(editModal.id, {
          folderId: editModal.folderId,
          name: editModal.name.trim(),
          path: editModal.path.trim(),
        })
      );
      setEditModal({ open: false });
      return;
    }

    if (!editModal.roleName.trim()) return;
    if (editModal.subFolderId > 0) {
      const normalizedRoleName = editModal.roleName.trim().toUpperCase();
      if (!availableRoleNames.includes(normalizedRoleName)) {
        toastError('Invalid role. Only ADMINISTRATOR and OPS_USER are supported.');
        return;
      }
      const relatedSubFolder = adminTree
        .flatMap((group) => group.folders)
        .flatMap((folder) => folder.subFolders)
        .find((subFolder) => subFolder.id === editModal.subFolderId);
      if (relatedSubFolder && isAdminOnlyPath(relatedSubFolder.path) && normalizedRoleName === 'OPS_USER') {
        toastError('OPS_USER cannot be assigned to admin-only paths (/settings/access-control*, /management/users*)');
        return;
      }
      await dispatch(
        updateNavigationRule(editModal.id, {
          roleName: normalizedRoleName,
          canAccess: editModal.canAccess,
        })
      );
      setEditModal({ open: false });
      return;
    }

    setEditModal({ open: false });
  };

  const saveMove = async () => {
    if (!moveModal.open) return;

    if (moveModal.kind === 'folder') {
      await dispatch(
        moveNavigationFolder(moveModal.id, {
          targetGroupId: moveModal.targetGroupId,
          targetIndex: moveModal.targetIndex,
        })
      );
      setMoveModal({ open: false });
      return;
    }

    await dispatch(
      moveNavigationSubFolder(moveModal.id, {
        targetFolderId: moveModal.targetFolderId,
        targetIndex: moveModal.targetIndex,
      })
    );
    setMoveModal({ open: false });
  };

  const treeView = useMemo(() => {
    if (!focusMode) return adminTree;
    if (!groupId) return adminTree;

    return adminTree
      .filter((group) => group.id === Number(groupId))
      .map((group) => ({
        ...group,
        folders: !folderId
          ? group.folders
          : group.folders
              .filter((folder) => folder.id === Number(folderId))
              .map((folder) => ({
                ...folder,
                subFolders: !subFolderId
                  ? folder.subFolders
                  : folder.subFolders.filter((sub) => sub.id === Number(subFolderId)),
              })),
      }));
  }, [adminTree, focusMode, groupId, folderId, subFolderId]);
  const allVisibleRuleIds = useMemo(
    () =>
      treeView
        .flatMap((group) => group.folders)
        .flatMap((folder) => folder.subFolders)
        .flatMap((subFolder) => subFolder.rules)
        .map((rule) => rule.id),
    [treeView]
  );

  return (
    <Row className="g-3">
      <Col lg="4">
        <Card className="panel-card">
          <CardBody>
            <h6 className="mb-2">Setup Wizard</h6>
            <div className="d-flex gap-1 flex-wrap mb-3">
              <Badge color={wizardStep >= 1 ? 'primary' : 'secondary'}>1. Group</Badge>
              <Badge color={wizardStep >= 2 ? 'primary' : 'secondary'}>2. Folder</Badge>
              <Badge color={wizardStep >= 3 ? 'primary' : 'secondary'}>3. Sub Folder</Badge>
              <Badge color={wizardStep >= 4 ? 'primary' : 'secondary'}>4. Rules</Badge>
            </div>

            <Form onSubmit={submitGroup} className="mb-3 border rounded p-2">
              <Label className="fs-12">Step 1: Select or create Group</Label>
              <Input
                type="select"
                value={groupId}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setGroupId(next);
                  if (next) setWizardStep(2);
                }}
              >
                <option value="">Select group</option>
                {adminTree.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Input>
              <Input
                className="mt-2"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Or create new group"
              />
              <div className="mt-2 d-flex gap-2">
                <Button color="primary" type="submit" size="sm">
                  Create Group
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  disabled={!groupId}
                  onClick={() => setWizardStep(2)}
                >
                  Next
                </Button>
              </div>
            </Form>

            <Form onSubmit={submitFolder} className="mb-3 border rounded p-2">
              <Label className="fs-12">Step 2: Select or create Folder</Label>
              <Input
                type="select"
                value={folderId}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setFolderId(next);
                  if (next) setWizardStep(3);
                }}
                disabled={!groupId}
              >
                <option value="">Select folder</option>
                {groupFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Input>
              <Input
                className="mt-2"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Or create new folder"
                disabled={!groupId}
              />
              <div className="mt-2 d-flex gap-2">
                <Button color="primary" type="submit" size="sm" disabled={!groupId}>
                  Create Folder
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  disabled={!folderId}
                  onClick={() => setWizardStep(3)}
                >
                  Next
                </Button>
              </div>
            </Form>

            <Form onSubmit={submitSubFolder} className="mb-3 border rounded p-2">
              <Label className="fs-12">Step 3: Select or create Sub Folder</Label>
              <Input
                type="select"
                value={subFolderId}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setSubFolderId(next);
                  if (next) setWizardStep(4);
                }}
                disabled={!folderId}
              >
                <option value="">Select sub folder</option>
                {ruleSubFolders.map((subFolder) => (
                  <option key={subFolder.id} value={subFolder.id}>
                    {subFolder.name} ({subFolder.path})
                  </option>
                ))}
              </Input>

              <Input
                className="mt-2"
                value={subFolderName}
                onChange={(e) => setSubFolderName(e.target.value)}
                placeholder="Or create new sub folder"
                disabled={!folderId}
              />

              <Input
                className="mt-2"
                type="select"
                value={pathPreset}
                onChange={(e) => {
                  const value = e.target.value;
                  setPathPreset(value);
                  if (value !== '__custom__') setSubFolderPath(value);
                }}
                disabled={!folderId}
              >
                <option value="/">/</option>
                <option value="/settings/access-control/users">/settings/access-control/users</option>
                <option value="/settings/access-control/users/details">/settings/access-control/users/details</option>
                <option value="/settings/access-control/navigation">/settings/access-control/navigation (ADMINISTRATOR only)</option>
                <option value="/settings/access-control/license">/settings/access-control/license (ADMINISTRATOR only)</option>
                <option value="__custom__">Custom...</option>
              </Input>

              <Input
                className="mt-2"
                value={subFolderPath}
                onChange={(e) => setSubFolderPath(e.target.value)}
                placeholder="/path"
                disabled={!folderId}
              />
              <div className="mt-2 d-flex gap-2">
                <Button color="primary" type="submit" size="sm" disabled={!folderId}>
                  Create Sub Folder
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  disabled={!subFolderId}
                  onClick={() => setWizardStep(4)}
                >
                  Next
                </Button>
              </div>
            </Form>

            <Form onSubmit={submitRule} className="border rounded p-2">
              <Label className="fs-12">Step 4: Add Rules</Label>
              <Input
                type="select"
                value={ruleFolderId}
                onChange={(e) => {
                  const nextFolderId = Number(e.target.value);
                  setRuleFolderId(nextFolderId);
                  setSubFolderId('');
                }}
              >
                <option value="">Select folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Input>
              <Input className="mt-2" type="select" value={subFolderId} onChange={(e) => setSubFolderId(Number(e.target.value))}>
                <option value="">Select sub folder</option>
                {ruleSubFolders.map((subFolder) => (
                  <option key={subFolder.id} value={subFolder.id}>
                    {subFolder.name} ({subFolder.path})
                  </option>
                ))}
              </Input>

              <Label className="fs-12">Access Rule</Label>

              <Input className="mt-2" type="select" value={roleName} onChange={(e) => setRoleName(e.target.value)}>
                {availableRoleNames.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Input>
              <div className="mt-2 border rounded p-2" style={{ maxHeight: 150, overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">Add many roles</small>
                  <div className="d-flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      color="light"
                      onClick={() => setSelectedRoleNames(availableRoleNames)}
                    >
                      All
                    </Button>
                    <Button type="button" size="sm" color="light" onClick={() => setSelectedRoleNames([])}>
                      None
                    </Button>
                  </div>
                </div>
                {availableRoleNames.map((role) => (
                  <div className="form-check" key={role}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`bulk-role-${role}`}
                      checked={selectedRoleNames.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    <label className="form-check-label fs-12" htmlFor={`bulk-role-${role}`}>
                      {role}
                    </label>
                  </div>
                ))}
              </div>

              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={canAccess}
                  onChange={(e) => setCanAccess(e.target.checked)}
                  id="canAccess"
                />
                <label className="form-check-label" htmlFor="canAccess">
                  Can access
                </label>
              </div>

              <Button className="mt-2" color="primary" type="submit" size="sm" disabled={!subFolderId}>
                Add Rule(s)
              </Button>
              <Button
                type="button"
                className="mt-2 ms-2"
                color="danger"
                outline
                size="sm"
                disabled={!subFolderId || selectedRoleNames.length === 0}
                onClick={() => void bulkRemoveSelectedRoles()}
              >
                Remove Selected Roles
              </Button>
            </Form>

            <div className="mt-2 d-flex gap-2 align-items-center">
              <Badge color="secondary">{selectedRuleIds.length} selected</Badge>
              <Button
                type="button"
                size="sm"
                color="light"
                onClick={() => setSelectedRuleIds(Array.from(new Set([...selectedRuleIds, ...allVisibleRuleIds])))}
              >
                Select All Visible
              </Button>
              <Button
                type="button"
                size="sm"
                color="light"
                onClick={() => setSelectedRuleIds((prev) => prev.filter((id) => !allVisibleRuleIds.includes(id)))}
              >
                Unselect Visible
              </Button>
              <Button
                type="button"
                size="sm"
                color="success"
                outline
                onClick={() => void dispatch(bulkSetNavigationRulesAccess({ ids: selectedRuleIds, canAccess: true }))}
              >
                Set ALLOW
              </Button>
              <Button
                type="button"
                size="sm"
                color="warning"
                outline
                onClick={() => void dispatch(bulkSetNavigationRulesAccess({ ids: selectedRuleIds, canAccess: false }))}
              >
                Set DENY
              </Button>
              <Button
                type="button"
                size="sm"
                color="danger"
                outline
                onClick={() => void dispatch(bulkDeleteNavigationRules({ ids: selectedRuleIds, confirm: false }))}
              >
                Fast Remove Selected
              </Button>
              <Button type="button" size="sm" color="light" onClick={() => setSelectedRuleIds([])}>
                Clear
              </Button>
            </div>

            <hr />
            <h6>Role Compatibility (Keycloak)</h6>
            <div className="mb-2 fs-12 text-muted">
              This page supports only <strong>ADMINISTRATOR</strong> and <strong>OPS_USER</strong>.
            </div>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {availableRoleNames.map((role) => (
                <Badge key={role} color="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="border rounded p-2">
              <div className="fs-12 text-muted mb-1">Current session user</div>
              <div className="fw-semibold">{currentUser?.name ?? 'Unknown user'}</div>
              <div className="small text-muted">{currentUser?.email ?? '-'}</div>
              <div className="mt-2 fs-12 text-muted">Current Keycloak roles</div>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {sessionRoles.length > 0 ? (
                  sessionRoles.map((role) => (
                    <Badge key={role} color={supportedRoleSet.has(role as (typeof KEYCLOAK_COMPATIBLE_ROLES)[number]) ? 'success' : 'light'} className={supportedRoleSet.has(role as (typeof KEYCLOAK_COMPATIBLE_ROLES)[number]) ? '' : 'text-dark'}>
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge color="danger">No roles in token</Badge>
                )}
              </div>
              <div className="mt-2 fs-12 text-muted">Effective app roles</div>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {sessionSupportedRoles.length > 0 ? (
                  sessionSupportedRoles.map((role) => (
                    <Badge key={role} color="primary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge color="danger">None (user will not get menu access)</Badge>
                )}
              </div>
            </div>

          </CardBody>
        </Card>
      </Col>

      <Col lg="8">
        <Card className="panel-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="m-0">Navigation Builder</h6>
              <div className="d-flex align-items-center gap-2 tree-toolbar">
                <small className="text-muted">Manual sort only (Up/Down or Move)</small>
                <Button type="button" size="sm" color="light" onClick={() => setAllExpanded(true)}>
                  Expand All
                </Button>
                <Button type="button" size="sm" color="light" onClick={() => setAllExpanded(false)}>
                  Collapse All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  color={focusMode ? 'primary' : 'light'}
                  onClick={() => setFocusMode((prev) => !prev)}
                >
                  {focusMode ? 'Focus: ON' : 'Focus: OFF'}
                </Button>
              </div>
            </div>

            <div className="nav-builder-root">
              {treeView.map((group) => (
                <div key={group.id} className="nav-item-card nav-item-group">
                  <div className="nav-item-head">
                    <div className="d-flex align-items-center gap-2">
                      <strong>{group.name}</strong>
                      <Badge color="light" className="text-dark">
                        Group
                      </Badge>
                    </div>
                    <div className="d-flex gap-1">
                      <Button size="sm" color="light" onClick={() => void moveGroupBy(group.id, -1)}>
                        Up
                      </Button>
                      <Button size="sm" color="light" onClick={() => void moveGroupBy(group.id, 1)}>
                        Down
                      </Button>
                      <Button size="sm" color="light" onClick={() => toggleExpanded(`group-${group.id}`)}>
                        {isExpanded(`group-${group.id}`) ? 'Collapse' : 'Expand'}
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        outline
                        onClick={() => setEditModal({ open: true, kind: 'group', id: group.id, name: group.name })}
                      >
                        Edit
                      </Button>
                      <Button size="sm" color="danger" outline onClick={() => void dispatch(deleteNavigationGroup(group.id))}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isExpanded(`group-${group.id}`) ? (
                    <div className="nav-item-children">
                      {group.folders.map((folder) => (
                        <div key={folder.id} className="nav-item-card nav-item-folder">
                          <div className="nav-item-head">
                            <div className="d-flex align-items-center gap-2">
                              <span>{folder.name}</span>
                              <Badge color="info">Folder</Badge>
                            </div>
                            <div className="d-flex gap-1">
                              <Button size="sm" color="light" onClick={() => void moveFolderBy(group, folder, -1)}>
                                Up
                              </Button>
                              <Button size="sm" color="light" onClick={() => void moveFolderBy(group, folder, 1)}>
                                Down
                              </Button>
                              <Button size="sm" color="light" onClick={() => toggleExpanded(`folder-${folder.id}`)}>
                                {isExpanded(`folder-${folder.id}`) ? 'Collapse' : 'Expand'}
                              </Button>
                              <Button
                                size="sm"
                                color="secondary"
                                outline
                                onClick={() =>
                                  setEditModal({
                                    open: true,
                                    kind: 'folder',
                                    id: folder.id,
                                    groupId: folder.groupId,
                                    name: folder.name,
                                  })
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                outline
                                onClick={() =>
                                  setMoveModal({
                                    open: true,
                                    kind: 'folder',
                                    id: folder.id,
                                    targetGroupId: folder.groupId,
                                    targetIndex: folder.sortOrder,
                                  })
                                }
                              >
                                Move
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                outline
                                onClick={() => void dispatch(deleteNavigationFolder(folder.id))}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          {isExpanded(`folder-${folder.id}`) ? (
                            <div className="nav-item-children">
                              {folder.subFolders.map((subFolder) => (
                                <div key={subFolder.id} className="nav-item-card nav-item-subfolder">
                                  <div className="nav-item-head">
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                      <span>{subFolder.name}</span>
                                      <Badge color="warning" className="text-dark">
                                        Sub Folder
                                      </Badge>
                                      <code>{subFolder.path}</code>
                                    </div>
                                    <div className="d-flex gap-1">
                                      <Button
                                        size="sm"
                                        color="light"
                                        onClick={() => void moveSubFolderBy(folder, subFolder.id, -1)}
                                      >
                                        Up
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="light"
                                        onClick={() => void moveSubFolderBy(folder, subFolder.id, 1)}
                                      >
                                        Down
                                      </Button>
                                      <Button size="sm" color="light" onClick={() => toggleExpanded(`sub-${subFolder.id}`)}>
                                        {isExpanded(`sub-${subFolder.id}`) ? 'Rules' : 'Open'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="secondary"
                                        outline
                                        onClick={() =>
                                          setEditModal({
                                            open: true,
                                            kind: 'subFolder',
                                            id: subFolder.id,
                                            folderId: subFolder.folderId,
                                            name: subFolder.name,
                                            path: subFolder.path,
                                          })
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="primary"
                                        outline
                                        onClick={() =>
                                          setMoveModal({
                                            open: true,
                                            kind: 'subFolder',
                                            id: subFolder.id,
                                            targetFolderId: subFolder.folderId,
                                            targetIndex: subFolder.sortOrder,
                                          })
                                        }
                                      >
                                        Move
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="danger"
                                        outline
                                        onClick={() => void dispatch(deleteNavigationSubFolder(subFolder.id))}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>

                                  {isExpanded(`sub-${subFolder.id}`) ? (
                                    <div className="rule-list">
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          color="light"
                                          onClick={() => selectAllRulesInSubFolder(subFolder.rules)}
                                        >
                                          Select All
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          color="light"
                                          onClick={() => clearRulesInSubFolder(subFolder.rules)}
                                        >
                                          Clear
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          color="success"
                                          outline
                                          disabled={selectedIdsInSubFolder(subFolder.rules).length === 0}
                                          onClick={() => void setSelectedInSubFolderAccess(subFolder.rules, true)}
                                        >
                                          Allow Selected
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          color="warning"
                                          outline
                                          disabled={selectedIdsInSubFolder(subFolder.rules).length === 0}
                                          onClick={() => void setSelectedInSubFolderAccess(subFolder.rules, false)}
                                        >
                                          Deny Selected
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          color="danger"
                                          outline
                                          disabled={selectedIdsInSubFolder(subFolder.rules).length === 0}
                                          onClick={() => void removeSelectedInSubFolder(subFolder.rules)}
                                        >
                                          Delete Selected
                                        </Button>
                                        <Badge color="secondary">
                                          {
                                            subFolder.rules.filter((rule) => selectedRuleIds.includes(rule.id)).length
                                          }{' '}
                                          selected
                                        </Badge>
                                      </div>
                                      {subFolder.rules.map((rule: NavigationRule) => {
                                        const invalidOpsOnAdminPath =
                                          rule.roleName.toUpperCase() === 'OPS_USER' && isAdminOnlyPath(subFolder.path);
                                        return (
                                        <div
                                          key={rule.id}
                                          className={`rule-chip rule-band ${rule.canAccess ? 'rule-band-allow' : 'rule-band-deny'}`}
                                        >
                                          <div className="d-flex align-items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={selectedRuleIds.includes(rule.id)}
                                              onChange={() => toggleRuleSelection(rule.id)}
                                            />
                                            <span className="role-band-title">{rule.roleName}</span>
                                            <Badge color={rule.canAccess ? 'success' : 'danger'}>
                                              {rule.canAccess ? 'ALLOW' : 'DENY'}
                                            </Badge>
                                            {invalidOpsOnAdminPath ? (
                                              <Badge color="warning" className="text-dark">
                                                Invalid for admin-only path
                                              </Badge>
                                            ) : null}
                                          </div>
                                          <div className="d-flex gap-1 rule-actions">
                                            <Button
                                              size="sm"
                                              color="secondary"
                                              outline
                                              onClick={() =>
                                                setEditModal({
                                                  open: true,
                                                  kind: 'rule',
                                                  id: rule.id,
                                                  subFolderId: rule.subFolderId,
                                                  roleName: rule.roleName,
                                                  canAccess: rule.canAccess,
                                                })
                                              }
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              size="sm"
                                              color="danger"
                                              outline
                                              onClick={() => void dispatch(deleteNavigationRule(rule.id))}
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        </div>
                                      )})}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

      </Col>

      <Modal isOpen={moveModal.open} toggle={() => setMoveModal({ open: false })}>
        <ModalHeader toggle={() => setMoveModal({ open: false })}>Move Item</ModalHeader>
        <ModalBody>
          {moveModal.open && moveModal.kind === 'folder' ? (
            <>
              <Label className="fs-12">Target Group</Label>
              <Input
                type="select"
                value={moveModal.targetGroupId}
                onChange={(e) =>
                  setMoveModal({
                    ...moveModal,
                    targetGroupId: Number(e.target.value),
                  })
                }
              >
                {adminTree.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Input>
              <Label className="fs-12 mt-2">Position Index</Label>
              <Input
                type="number"
                min={0}
                value={moveModal.targetIndex}
                onChange={(e) =>
                  setMoveModal({
                    ...moveModal,
                    targetIndex: Number(e.target.value),
                  })
                }
              />
            </>
          ) : null}

          {moveModal.open && moveModal.kind === 'subFolder' ? (
            <>
              <Label className="fs-12">Target Folder</Label>
              <Input
                type="select"
                value={moveModal.targetFolderId}
                onChange={(e) =>
                  setMoveModal({
                    ...moveModal,
                    targetFolderId: Number(e.target.value),
                  })
                }
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Input>
              <Label className="fs-12 mt-2">Position Index</Label>
              <Input
                type="number"
                min={0}
                value={moveModal.targetIndex}
                onChange={(e) =>
                  setMoveModal({
                    ...moveModal,
                    targetIndex: Number(e.target.value),
                  })
                }
              />
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setMoveModal({ open: false })}>
            Cancel
          </Button>
          <Button color="primary" onClick={() => void saveMove()}>
            Move
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={editModal.open} toggle={() => setEditModal({ open: false })}>
        <ModalHeader toggle={() => setEditModal({ open: false })}>Edit Item</ModalHeader>
        <ModalBody>
          {editModal.open && editModal.kind === 'group' ? (
            <>
              <Label className="fs-12">Group name</Label>
              <Input
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                placeholder="Group name"
              />
            </>
          ) : null}

          {editModal.open && editModal.kind === 'folder' ? (
            <>
              <Label className="fs-12">Folder name</Label>
              <Input
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                placeholder="Folder name"
              />
            </>
          ) : null}

          {editModal.open && editModal.kind === 'subFolder' ? (
            <>
              <Label className="fs-12">Sub folder name</Label>
              <Input
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                placeholder="Sub folder name"
              />
              <Label className="fs-12 mt-2">Path</Label>
              <Input
                value={editModal.path}
                onChange={(e) => setEditModal({ ...editModal, path: e.target.value })}
                placeholder="/path"
              />
            </>
          ) : null}

          {editModal.open && editModal.kind === 'rule' ? (
            <>
              <Label className="fs-12">Role</Label>
              {editModal.subFolderId > 0 ? (
                <Input
                  type="select"
                  value={editModal.roleName.toUpperCase()}
                  onChange={(e) => setEditModal({ ...editModal, roleName: e.target.value.toUpperCase() })}
                >
                  {availableRoleNames.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Input>
              ) : (
                <Input
                  value={editModal.roleName}
                  onChange={(e) => setEditModal({ ...editModal, roleName: e.target.value.toUpperCase() })}
                  placeholder="Navigation role name"
                />
              )}
              {editModal.subFolderId > 0 ? (
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={editModal.canAccess}
                    onChange={(e) => setEditModal({ ...editModal, canAccess: e.target.checked })}
                    id="editRuleCanAccess"
                  />
                  <label className="form-check-label" htmlFor="editRuleCanAccess">
                    Can access
                  </label>
                </div>
              ) : null}
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setEditModal({ open: false })}>
            Cancel
          </Button>
          <Button color="primary" onClick={() => void saveEdit()}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </Row>
  );
}

export default NavigationRulesPage;
