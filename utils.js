class UnexpectedColumns extends Error {
  constructor(currCol, cols, row = 1, file = 'file') {
    super(
      `Failed to parse ${file}. Expected ${cols.length} columns: ${cols}. Parsed ${currCol} columns at row ${row}.`
    );
    this.name = "UnexpectedColumns";
  }
}


export function checkCols(currCol, cols, row, file) {
  if (currCol !== cols.length) {
    throw new UnexpectedColumns(currCol, cols, row, file);
  }
}


export function objAtZeroFactory(array) {
  /* Takes an array and returns a new object
  with each element as a key with value 0. */
  let newObj = {};
  array.forEach(el => newObj[el] = 0);
  return newObj;
}