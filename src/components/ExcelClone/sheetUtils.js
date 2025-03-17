// (row,col) -> "row,col"
export function makeKey(row, col) {
  return `${row},${col}`;
}

// "row,col" -> { row, col }
export function parseKey(key) {
  const [r, c] = key.split(",").map(Number);
  return { row: r, col: c };
}

// A, B, ..., Z, AA, AB, ...
export function getColumnLabel(colIndex) {
  let label = "";
  let temp = colIndex;
  while (true) {
    const r = temp % 26;
    label = String.fromCharCode(65 + r) + label;
    temp = Math.floor(temp / 26) - 1;
    if (temp < 0) break;
  }
  return label;
}

// (row, col) -> "A1"
export function getCellAddress(row, col) {
  let label = "";
  let temp = col;
  while (true) {
    const r = temp % 26;
    label = String.fromCharCode(65 + r) + label;
    temp = Math.floor(temp / 26) - 1;
    if (temp < 0) break;
  }
  return label + (row + 1);
}

// "A1" -> (row=0, col=0)
export function addressToRC(address) {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  let colIndex = 0;
  const colStr = match[1];
  for (let i = 0; i < colStr.length; i++) {
    colIndex *= 26;
    colIndex += colStr.charCodeAt(i) - 65 + 1;
  }
  colIndex -= 1;

  const rowIndex = parseInt(match[2], 10) - 1;
  return { row: rowIndex, col: colIndex };
}

// "=A1+B2" -> ["A1", "B2"]
export function parseFormulaRefs(formula) {
  const expr = formula.replace("=", "").trim();
  return expr
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}
