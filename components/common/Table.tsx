import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export const Table = <T extends { id: string },>(
  { columns, data, onRowClick }: TableProps<T>
) => {
  const rowClasses = onRowClick
    ? "border-t border-border hover:bg-border/30 transition-colors cursor-pointer"
    : "border-t border-border hover:bg-border/30 transition-colors";

  return (
    <div className="bg-surface rounded-xl shadow-lg overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-border/50">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="p-4 font-semibold text-sm uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr 
                key={item.id} 
                className={rowClasses}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-4 align-top">
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center p-8 text-text-secondary">
                Aucune donnée disponible.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};