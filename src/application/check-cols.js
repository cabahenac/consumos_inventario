

class UnexpectedColumns extends Error {
  constructor(lastCol, cols, row = 1, file = 'file') {
    super(
      `Failed to parse ${file}. Expected ${cols.length} columns: ${cols}. Parsed ${lastCol} columns at row ${row}.`
    );
    this.name = "UnexpectedColumns";
  }
}


export default function checkCols(lastCol, cols, row, file) {
  if (lastCol !== cols.length) {
    throw new UnexpectedColumns(currCol, cols, row, file);
  }
}
