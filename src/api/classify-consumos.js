import quimiosNames from "../data/quimios-names.js";
import ArrayClassifier from "./ArrayClassifier.js";
import checkCols from "./check-cols.js";

function objAtZeroFactory(array) {
  /* Takes an array and returns a new object
  with each element as a key with value 0. */
  let newObj = {};
  array.forEach((el) => (newObj[el] = 0));
  return newObj;
}

function rvoStrategy(string, accumulator) {
  /* Skip reagents that are not on the database
  and log them to the console */
  if (!quimiosNames[string]) {
    this.skip = true; // Program to skip numbers.
    this.currChild = 0; // Clean up before skipping reagent.
    if (
      [
        "BILIIMTY",
        "CAPFIJMT",
        "COLLMTY",
        "COLVLMTY",
        "%DESATMT",
        "GLOBULMT",
        "INDICMTY",
        "IRI_MTY",
        "REL",
        "A/GM",
        "RELBUNCM",
        "UREMTY",
        "ESTTOMTY",
        "ITLMTY",
        "YODOPRMT",
        "%PSALMTY",
      ].includes(string)
    )
      return;
    this.log.push(string);
    return; // Continue to numbers and skip them in their loop cycle.
  }

  /* At the start of every non-skippable reagent row, 
  check the number of columns of the previous row. */
  checkCols(this.currChild, this.expectedChilds, this.prevParent);
  this.currChild = 0; // Then set the columns to 0.
  this.skip = false; // And cancel skip.

  // Get the QUIMIOS name of the reagent
  this.currParent = quimiosNames[string];

  /* If the reagent is not defined, assign 
  it to an empty object at 0 consumption. */
  accumulator[this.currParent] ??= objAtZeroFactory(this.expectedChilds);
}

function rvoCheck(string) {
  return isNaN(string);
}

function consumosStrategy(string, accumulator) {
  // After each number found, update currCol.
  /* And keep track of this reagent 
  before it changes in the next loop. */

  // Check if the reagent should be skipped.
  if (this.skip) {
    this.currChild++;
    this.prevParent = this.currParent;
  } else {
    // Coerse string into numeric.
    const consumption = +string;
    if (consumption) {
      accumulator[this.currParent][this.expectedChilds[this.currChild]] += // Access the reagent. // Access the column name.
        consumption; // And sum the value.
    }

    this.currChild++;
    this.prevParent = this.currParent;
  }
}

function consumosCleanUp() {
  checkCols(this.currChild, this.expectedChilds, this.prevParent);
}

function consumosLogger() {
  if (this.log?.length !== 0) {
    console.log(
      "\nSe ignoraron",
      ...this.log,
      "debido a que no están en la base de datos."
    );
  }
}

export function classifyConsumos(array, cols) {
  const consumosOrganizer = new ArrayClassifier(
    array,
    rvoStrategy,
    rvoCheck,
    consumosStrategy,
    cols,
    consumosCleanUp,
    consumosLogger
  );
  return consumosOrganizer.parse();
}
