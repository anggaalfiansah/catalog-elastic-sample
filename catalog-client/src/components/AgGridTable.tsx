import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry, themeBalham } from "ag-grid-community";
import { AgGridReact, type InternalAgGridReactProps } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

interface AgGridTableProps<T> extends InternalAgGridReactProps {
  rowData: T[]; 
  colDefs: ColDef<T>[]; 
}
const AgGridTable = <T,>(props: AgGridTableProps<T>) => {
  const { rowData, colDefs } = props;
 

  return (
    <div style={{ height: "calc(100vh - 275px)", width: "100%" }}>
      <AgGridReact theme={themeBalham} rowHeight={35} {...props} rowData={rowData} columnDefs={colDefs} />
    </div>
  );
};

export default AgGridTable;
