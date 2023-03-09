class UnexpectedColumns extends Error {
  constructor(currCol, cols, row) {
    super(
      `Failed to parse file. Expected ${cols.length} columns: ${cols}. Parsed ${currCol} columns at row ${row}.`
    );
    this.name = "UnexpectedColumns";
  }
}

const fruits = ['apple', 1, 'orange', 4, 5, 'pineapple', 5, 6,];
const obj = {};
const cols = ['a', 'b'];
let currFruit = '';
const expectedCols = 2
let currCol = 2;


function checkCols(rvo) {
  if (currCol !== cols.length) {
    throw new UnexpectedColumns(currCol, cols, rvo);
  }
}

let row = -1
for (let el of fruits) {
  if (isNaN(el)) {
    checkCols(obj[el]);
    row++
    obj[el] ??= {'a': 0, 'b': 0};
    currFruit = el;
    currCol = 0
    continue
  }
  if (el) {
    obj[currFruit][cols[currCol]] += el;
    currCol++;
  }
}
checkCols(obj[el]);