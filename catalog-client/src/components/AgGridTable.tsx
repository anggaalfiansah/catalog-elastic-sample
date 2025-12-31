import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry, themeBalham } from "ag-grid-community";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react"; // Gunakan AgGridReactProps

ModuleRegistry.registerModules([AllCommunityModule]);

// Kita extend AgGridReactProps supaya semua props bawaan AG Grid (pagination, onGridReady, dll) bisa masuk.
interface CustomAgGridTableProps<T> extends AgGridReactProps<T> {
  // 1. Ubah rowData jadi OPTIONAL dan NULLABLE
  //    Ini penting buat mode Infinite Row Model
  rowData?: T[] | null; 
  
  // 2. Mapping colDefs ke standard AG Grid
  colDefs: ColDef<T>[]; 
}

const AgGridTable = <T,>(props: CustomAgGridTableProps<T>) => {
  // Pisahkan prop custom kita, sisanya (...rest) lempar ke AgGridReact
  const { rowData, colDefs, ...rest } = props;

  return (
    <div style={{ height: "calc(100vh - 275px)", width: "100%" }}>
      <AgGridReact
        theme={themeBalham}
        rowHeight={35}
        
        // Mapping props custom kita ke props asli AG Grid
        columnDefs={colDefs}
        rowData={rowData} // Sekarang aman nerima null
        
        // Spread props sisanya (pagination, rowModelType, onGridReady, dll)
        {...rest} 
      />
    </div>
  );
};

export default AgGridTable;