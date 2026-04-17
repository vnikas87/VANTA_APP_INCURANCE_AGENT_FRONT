import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardBody, Col, Input, Label, Row } from 'reactstrap';
import type { FilterDraft, FiltersPanelProps } from '../types';

type SimpleField = Exclude<keyof FilterDraft, 'tableFilters'>;

const OPERATOR_LABELS: Record<string, string> = {
  contains: 'contains',
  equals: '=',
  startsWith: 'starts with',
  gte: '>=',
  lte: '<=',
};

function ProductionFilters(props: FiltersPanelProps) {
  const {
    filtersOpen,
    setFiltersOpen,
    draftFilters,
    setDraftFilters,
    activeFilterCount,
    columnFilterOptions,
    onApplyFilters,
    onClearFilters,
    onSaveView,
  } = props;

  const [newField, setNewField] = useState(columnFilterOptions[0]?.value ?? 'customer');
  const [newOperator, setNewOperator] = useState('contains');
  const [newValue, setNewValue] = useState('');

  const selectedField = useMemo(
    () => columnFilterOptions.find((item) => item.value === newField) ?? columnFilterOptions[0],
    [columnFilterOptions, newField]
  );

  const normalizedOperator = selectedField?.operators.includes(newOperator)
    ? newOperator
    : selectedField?.operators[0] ?? 'contains';

  const simpleFilterChips = useMemo(() => {
    const chips: Array<{ key: SimpleField; label: string }> = [];
    (Object.keys(draftFilters) as Array<keyof FilterDraft>).forEach((key) => {
      if (key === 'tableFilters') return;
      const val = draftFilters[key];
      const hasVal = Array.isArray(val) ? val.length > 0 : val.trim().length > 0;
      if (!hasVal) return;
      chips.push({ key, label: String(key) });
    });
    return chips;
  }, [draftFilters]);

  const removeSimpleFilter = (key: SimpleField) => {
    if (Array.isArray(draftFilters[key])) {
      setDraftFilters({ ...draftFilters, [key]: [] });
      return;
    }
    setDraftFilters({ ...draftFilters, [key]: '' });
  };

  const addAdvancedFilter = () => {
    const value = newValue.trim();
    if (!selectedField || !value) return;
    setDraftFilters({
      ...draftFilters,
      tableFilters: [
        ...draftFilters.tableFilters,
        {
          columnName: selectedField.value,
          operator: normalizedOperator,
          value,
        },
      ],
    });
    setNewValue('');
  };

  return (
    <Col lg="12">
      <Card className="panel-card">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0">Smart Filters</h6>
            <div className="d-flex align-items-center gap-2">
              <Badge color={activeFilterCount > 0 ? 'primary' : 'light'}>Active: {activeFilterCount}</Badge>
              <Button color="light" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
                {filtersOpen ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          {filtersOpen ? (
            <>
              <Row className="g-2 mb-3">
                <Col md="12">
                  <Label className="fs-12">Search</Label>
                  <Input
                    value={draftFilters.query}
                    onChange={(e) => setDraftFilters({ ...draftFilters, query: e.target.value })}
                    placeholder="Search records..."
                  />
                </Col>
              </Row>

              <div className="mb-2 fs-13 fw-semibold">Add Advanced Filter</div>
              <Row className="g-2 mb-3">
                <Col md="4">
                  <Input
                    type="select"
                    value={newField}
                    onChange={(e) => {
                      const next = e.target.value;
                      setNewField(next);
                      const found = columnFilterOptions.find((item) => item.value === next);
                      setNewOperator(found?.operators[0] ?? 'contains');
                    }}
                  >
                    {columnFilterOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </Input>
                </Col>
                <Col md="2">
                  <Input type="select" value={normalizedOperator} onChange={(e) => setNewOperator(e.target.value)}>
                    {(selectedField?.operators ?? ['contains']).map((op) => (
                      <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                    ))}
                  </Input>
                </Col>
                <Col md="4">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Value"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAdvancedFilter();
                      }
                    }}
                  />
                </Col>
                <Col md="2">
                  <Button color="light" className="w-100" onClick={addAdvancedFilter}>Add</Button>
                </Col>
              </Row>

              {(simpleFilterChips.length > 0 || draftFilters.tableFilters.length > 0) ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {simpleFilterChips.map((chip) => (
                    <button
                      key={`simple-${chip.key}`}
                      type="button"
                      className="btn btn-sm btn-soft-primary"
                      onClick={() => removeSimpleFilter(chip.key)}
                    >
                      {chip.label} ×
                    </button>
                  ))}

                  {draftFilters.tableFilters.map((item, idx) => {
                    const col = columnFilterOptions.find((x) => x.value === item.columnName);
                    return (
                      <button
                        key={`${item.columnName}-${item.operator ?? 'contains'}-${item.value}-${idx}`}
                        type="button"
                        className="btn btn-sm btn-soft-info"
                        onClick={() => {
                          setDraftFilters({
                            ...draftFilters,
                            tableFilters: draftFilters.tableFilters.filter((_, i) => i !== idx),
                          });
                        }}
                      >
                        {col?.label ?? item.columnName} {OPERATOR_LABELS[item.operator ?? 'contains'] ?? item.operator ?? 'contains'} {item.value} ×
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="d-flex gap-2">
                <Button color="primary" onClick={onApplyFilters}>Apply Filters</Button>
                <Button color="light" onClick={onClearFilters}>Clear Filters</Button>
                <Button color="success" onClick={onSaveView}>Save View</Button>
              </div>
            </>
          ) : null}
        </CardBody>
      </Card>
    </Col>
  );
}

export default ProductionFilters;
