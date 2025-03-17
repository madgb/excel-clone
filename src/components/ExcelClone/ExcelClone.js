import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import useDebouncedResize from "./useDebouncedResize";

import {
  makeKey,
  getColumnLabel,
  getCellAddress,
  addressToRC,
  parseFormulaRefs,
} from "./sheetUtils";

const ROW_COUNT = 10000;
const COLUMN_COUNT = 10000;

function ExcelClone() {
  const viewportSize = useDebouncedResize();

  const gridHeight = useMemo(
    () => viewportSize.height - 100,
    [viewportSize.height]
  );
  const gridWidth = useMemo(
    () => viewportSize.width - 20,
    [viewportSize.width]
  );

  const [sheetData, setSheetData] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!selectedCell) {
      setEditValue("");
      return;
    }
    const { row, col } = selectedCell;
    const key = makeKey(row, col);
    const cellObj = sheetData[key];

    if (!cellObj) {
      setEditValue("");
    } else if (cellObj.formula) {
      setEditValue(cellObj.formula);
    } else {
      setEditValue(cellObj.value || "");
    }
  }, [selectedCell, sheetData]);

  const getDisplayValue = useCallback(
    (row, col) => {
      const key = makeKey(row, col);
      const cell = sheetData[key];
      if (!cell) return "";

      if (cell.formula) {
        const refs = parseFormulaRefs(cell.formula);
        let sum = 0;
        for (const ref of refs) {
          const rc = addressToRC(ref);
          if (!rc) continue;
          const refKey = makeKey(rc.row, rc.col);
          const refCell = sheetData[refKey];
          if (refCell?.formula) {
            sum += parseFloat(getDisplayValue(rc.row, rc.col)) || 0;
          } else if (refCell?.value) {
            sum += parseFloat(refCell.value) || 0;
          }
        }
        return sum;
      } else if (cell.value) {
        return cell.value;
      } else {
        return "";
      }
    },
    [sheetData]
  );

  const commitEdit = useCallback(() => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const key = makeKey(row, col);
    const newValue = editValue.trim();

    setSheetData((prev) => {
      const newData = { ...prev };
      if (newValue.startsWith("=")) {
        newData[key] = { formula: newValue };
      } else {
        newData[key] = { value: newValue };
      }
      return newData;
    });

    setEditMode(false);
  }, [selectedCell, editValue]);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });

    const key = makeKey(row, col);
    const cellObj = sheetData[key];
    if (!cellObj) {
      setEditValue("");
    } else if (cellObj.formula) {
      setEditValue(cellObj.formula);
    } else {
      setEditValue(cellObj.value || "");
    }

    setEditMode(true);
  };

  const handleFormulaBarKeyDown = (e) => {
    if (!selectedCell) return;

    if (e.key === "Enter") {
      commitEdit();
      setSelectedCell((prev) => {
        if (!prev) return null;
        return { row: prev.row + 1, col: prev.col };
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      setSelectedCell((prev) => {
        if (!prev) return null;
        return { row: prev.row, col: prev.col + 1 };
      });
    }
  };

  const handleCellInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      setSelectedCell((prev) => {
        if (!prev) return null;
        return { row: prev.row + 1, col: prev.col };
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      setSelectedCell((prev) => {
        if (!prev) return null;
        return { row: prev.row, col: prev.col + 1 };
      });
    }
    setEditMode(true);
  };

  const handleCellInputBlur = () => {
    commitEdit();
  };

  const CellRendererBase = ({ rowIndex, columnIndex, style }) => {
    if (rowIndex === 0 && columnIndex === 0) {
      return <div style={{ ...cellStyle, ...style, background: "#f0f0f0" }} />;
    }
    if (rowIndex === 0 && columnIndex > 0) {
      return (
        <div
          style={{
            ...cellStyle,
            ...style,
            background: "#f0f0f0",
            fontWeight: "bold",
          }}
        >
          {getColumnLabel(columnIndex - 1)}
        </div>
      );
    }
    if (columnIndex === 0 && rowIndex > 0) {
      return (
        <div
          style={{
            ...cellStyle,
            ...style,
            background: "#f0f0f0",
            fontWeight: "bold",
          }}
        >
          {rowIndex}
        </div>
      );
    }

    const row = rowIndex - 1;
    const col = columnIndex - 1;
    const isSelected =
      selectedCell && selectedCell.row === row && selectedCell.col === col;
    const editingThisCell = isSelected && editMode;

    if (!editingThisCell) {
      const displayValue = getDisplayValue(row, col);
      return (
        <div
          style={{ ...cellStyle, ...style, background: "#fff" }}
          onClick={() => handleCellClick(row, col)}
        >
          {String(displayValue)}
        </div>
      );
    } else {
      return (
        <input
          style={{
            ...cellStyle,
            ...style,
            outline: "none",
            background: "#fff",
            padding: 0,
          }}
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleCellInputKeyDown}
          onBlur={handleCellInputBlur}
        />
      );
    }
  };

  const CellRenderer = React.memo(CellRendererBase, (prev, next) => {
    if (
      prev.rowIndex !== next.rowIndex ||
      prev.columnIndex !== next.columnIndex
    ) {
      return false;
    }

    const row = next.rowIndex - 1;
    const col = next.columnIndex - 1;
    const isSelectedNow =
      next.parentProps.selectedCell &&
      next.parentProps.selectedCell.row === row &&
      next.parentProps.selectedCell.col === col;
    const wasSelected =
      prev.parentProps.selectedCell &&
      prev.parentProps.selectedCell.row === prev.rowIndex - 1 &&
      prev.parentProps.selectedCell.col === prev.columnIndex - 1;

    const isEditingNow = isSelectedNow && next.parentProps.editMode;
    const wasEditing = wasSelected && prev.parentProps.editMode;

    if (isSelectedNow !== wasSelected) return false;
    if (isEditingNow !== wasEditing) return false;

    if (prev.parentProps.sheetData !== next.parentProps.sheetData) {
      const key = makeKey(row, col);
      const prevCell = prev.parentProps.sheetData[key];
      const nextCell = next.parentProps.sheetData[key];
      if (JSON.stringify(prevCell) !== JSON.stringify(nextCell)) {
        return false;
      }
    }

    return true;
  });

  const parentProps = {
    sheetData,
    selectedCell,
    editMode,
    editValue,
  };

  const cellStyle = {
    boxSizing: "border-box",
    border: "1px solid #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  };

  return (
    <div style={{ padding: 10 }}>
      <h2>SpreadSheet</h2>

      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>
          {selectedCell
            ? `Current cell: ${getCellAddress(
                selectedCell.row,
                selectedCell.col
              )}`
            : ""}
        </span>
        <input
          style={{ width: 400, fontSize: "14px", padding: 4 }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleFormulaBarKeyDown}
          placeholder="=A1+B2"
        />
      </div>

      <Grid
        columnCount={COLUMN_COUNT + 1}
        rowCount={ROW_COUNT + 1}
        columnWidth={80}
        rowHeight={24}
        height={gridHeight}
        width={gridWidth}
        itemData={parentProps}
      >
        {({ rowIndex, columnIndex, style, data }) => {
          return (
            <CellRenderer
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              style={style}
              parentProps={data}
            />
          );
        }}
      </Grid>
    </div>
  );
}

export default ExcelClone;
