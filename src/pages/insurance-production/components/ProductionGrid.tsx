import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  FilteringState,
  GroupingState,
  IntegratedFiltering,
  IntegratedGrouping,
  IntegratedSorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  ColumnChooser,
  DragDropProvider,
  Grid,
  Table,
  TableColumnVisibility,
  TableColumnReordering,
  TableFilterRow,
  TableHeaderRow,
  Toolbar,
} from '@devexpress/dx-react-grid-bootstrap4';
import { Button, Card, CardBody, Col, DropdownItem, DropdownMenu, DropdownToggle, Input, UncontrolledDropdown } from 'reactstrap';
import type { ProductionGridProps } from '../types';

type ProductionGridCardProps = ProductionGridProps & {
  mainTableTitle: string;
  openDetailsLabel: string;
};

function ProductionGridCard(props: ProductionGridCardProps) {
  const {
    columns,
    rows,
    columnOrder,
    hiddenColumnNames,
    grouping,
    tableFilters,
    sorting,
    onColumnOrderChange,
    onHiddenColumnNamesChange,
    onGroupingChange,
    onTableFiltersChange,
    onSortingChange,
    mainTableTitle,
    openDetailsLabel,
  } = props;

  const Cell = ({ column, row, ...restProps }: any) => {
    if (column.name === 'actions') {
      return (
        <Table.Cell {...restProps}>
          <Button tag={Link} color="primary" outline size="sm" to={`/insurance/production/${row.id}`}>
            <i className="ri-eye-line me-1" />
            {openDetailsLabel}
          </Button>
        </Table.Cell>
      );
    }
    return <Table.Cell column={column} row={row} {...restProps} />;
  };

  const HeaderCell = ({ column, ...restProps }: any) => (
    <TableHeaderRow.Cell
      {...restProps}
      column={column}
      style={{
        whiteSpace: 'normal',
        lineHeight: 1.2,
        verticalAlign: 'middle',
      }}
      title={column?.title}
    />
  );

  const filterColumnExtensions = [{ columnName: 'actions', filteringEnabled: false }];
  const groupingColumnExtensions = [{ columnName: 'actions', groupingEnabled: false }];
  const hideableColumns = useMemo(() => columns.filter((column) => column.name !== 'actions'), [columns]);

  const toggleColumnVisibility = (columnName: string) => {
    const isHidden = hiddenColumnNames.includes(columnName);
    if (isHidden) {
      onHiddenColumnNamesChange(hiddenColumnNames.filter((item) => item !== columnName));
      return;
    }
    onHiddenColumnNamesChange([...hiddenColumnNames, columnName]);
  };

  return (
    <Col lg="12">
      <Card className="panel-card">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <h6 className="mb-0">{mainTableTitle}</h6>
            <div className="d-flex align-items-center gap-2">
              <UncontrolledDropdown>
                <DropdownToggle color="light" size="sm" caret>
                  <i className="ri-eye-line me-1" />
                  View Columns
                </DropdownToggle>
                <DropdownMenu end style={{ minWidth: 260, maxHeight: 320, overflowY: 'auto' }}>
                  <DropdownItem header>Column Visibility</DropdownItem>
                  {hideableColumns.map((column) => (
                    <DropdownItem
                      key={column.name}
                      toggle={false}
                      className="d-flex align-items-center gap-2"
                      onClick={() => toggleColumnVisibility(String(column.name))}
                    >
                      <Input
                        type="checkbox"
                        checked={!hiddenColumnNames.includes(String(column.name))}
                        onChange={() => toggleColumnVisibility(String(column.name))}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span>{column.title}</span>
                    </DropdownItem>
                  ))}
                  <DropdownItem divider />
                  <DropdownItem onClick={() => onHiddenColumnNamesChange([])}>
                    Show All Columns
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>
          </div>
          <div className="text-muted fs-12 mb-2">
            Drag/drop order is saved. Visible columns are also saved per user.
          </div>
          <Grid rows={rows} columns={columns}>
            <DragDropProvider />
            <FilteringState
              filters={tableFilters.map((f) => ({ columnName: f.columnName, value: f.value })) as any}
              onFiltersChange={(nextFilters) => onTableFiltersChange(nextFilters as any)}
              columnExtensions={filterColumnExtensions as any}
            />
            <SortingState
              sorting={sorting as any}
              onSortingChange={(nextSorting) => onSortingChange(nextSorting as any)}
            />
            <GroupingState
              grouping={grouping as any}
              onGroupingChange={(nextGrouping) => onGroupingChange(nextGrouping as any)}
              columnExtensions={groupingColumnExtensions as any}
            />
            <IntegratedFiltering />
            <IntegratedSorting />
            <IntegratedGrouping />
            <Table cellComponent={Cell} />
            <TableHeaderRow showSortingControls showGroupingControls cellComponent={HeaderCell} />
            <TableFilterRow />
            <TableColumnVisibility
              hiddenColumnNames={hiddenColumnNames}
              onHiddenColumnNamesChange={(nextHidden) => onHiddenColumnNamesChange(nextHidden as string[])}
            />
            <Toolbar />
            <ColumnChooser />
            <TableColumnReordering
              order={columnOrder}
              onOrderChange={(order) => onColumnOrderChange(order as string[])}
            />
          </Grid>
        </CardBody>
      </Card>
    </Col>
  );
}

export default ProductionGridCard;
