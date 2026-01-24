import { useState, useEffect } from "react";

const ExcelViewer = ({ invoices, isEditable = false, onUpdate = null }) => {
  const [data, setData] = useState(invoices || []);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setData(invoices || []);
  }, [invoices]);

  const columns = [
    "File",
    "Invoice #",
    "Date",
    "GSTIN",
    "Amount",
    "Tax",
    "Total",
    "Status",
  ];

  const handleCellEdit = (rowIdx, colName) => {
    if (!isEditable) return;

    const value = data[rowIdx][colName] || "";
    setEditingCell({ row: rowIdx, col: colName });
    setEditValue(value);
  };

  const handleCellChange = (rowIdx, colName, value) => {
    const newData = [...data];
    newData[rowIdx] = {
      ...newData[rowIdx],
      [colName]: value,
    };
    setData(newData);
    setEditingCell(null);

    if (onUpdate) {
      onUpdate(newData);
    }
  };

  const handleKeyDown = (e, rowIdx, colName) => {
    if (e.key === "Enter") {
      handleCellChange(rowIdx, colName, editValue);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const getMismatchColor = (row) => {
    if (row.status === "error") return "bg-red-50";
    if (row.hasIssues) return "bg-yellow-50";
    return "bg-white";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border- mt-4">
      <table className="w-full text-sm text-black">
        <thead>
          <tr className="bg-gray-800 border-black border-b">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold text-gray-700 bg-[#1E6A40] text-white"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b hover:bg-gray-50 ${getMismatchColor(row)}`}
            >
              {columns.map((col) => {
                const isEditing =
                  editingCell?.row === rowIdx && editingCell?.col === col;
                const columnKey = col
                  .toLowerCase()
                  .replace("#", "")
                  .replace(/\s+/g, "_");
                const value = row[columnKey] || row[col] || "-";

                return (
                  <td
                    key={`${rowIdx}-${col}`}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50"
                    onClick={() => handleCellEdit(rowIdx, columnKey)}
                  >
                    {isEditing && isEditable ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellChange(rowIdx, columnKey, editValue)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, columnKey)}
                        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={
                          value === "ERROR" || row.status === "error"
                            ? "text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {value}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No invoice data available
        </div>
      )}

      {isEditable && (
        <div className="px-4 py-3 bg-blue-50 border-t text-sm text-gray-600">
          💡 Click on any cell to edit. Press Enter to save or Escape to cancel.
        </div>
      )}
    </div>
  );
};

export default ExcelViewer;
