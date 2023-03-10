class UnexpectedColumns extends Error {
  constructor(currCol, cols, row = 1, file = 'file') {
    super(
      `Failed to parse ${file}. Expected ${cols.length} columns: ${cols}. Parsed ${currCol} columns at row ${row}.`
    );
    this.name = "UnexpectedColumns";
  }
}

const fruits = ['apple', 'orange', 4, 5, 'pineapple', 5,];
const obj = {};
const cols = ['a', 'b'];
let currFruit = '';
const expectedCols = 2
let currCol = 2;


function checkCols(row) {
  if (currCol !== cols.length) {
    throw new UnexpectedColumns(currCol, cols, row);
  }
}

for (let el of fruits) {
  if (isNaN(el)) {
    checkCols(x);
    obj[el] ??= {'a': 0, 'b': 0};
    currFruit = el;
    currCol = 0
    continue
  }
  if (el) {
    obj[currFruit][cols[currCol]] += el;
  }
  currCol++;
  var x = currFruit;
  console.log(obj);
}
checkCols(x);
