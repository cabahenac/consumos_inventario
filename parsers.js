import { PdfDataParser } from 'pdf-data-parser';
import { readdir } from 'fs/promises';
import quimiosNames from './quimios-names.js';
import { checkCols, objAtZeroFactory } from './utils.js';
import { log } from 'console';


// PDF parsers:


async function parsePdf(file) {
  const parser = new PdfDataParser({ url: file });
  const parsedPdf = await parser.parse();
  /* PdfDataParser.parse() returns a promise
    of an array of arrays of string data*/
  const data = parsedPdf[0][0] // Access the string
    .split(' '); // and split it by whitespace.
  return data;
}


export async function getPdfData(from, to) {
  // Read directory and get all file names.
  let files = await readdir('./pdf');

  // Filter PDF files.
  files = files.filter(file => file.endsWith('.pdf'));
  
  // Queue a promise of parsing each file.
  const promisesOfData = files.map(
    file => parsePdf('./pdf/' + file)
  );
  
  // Parse from and to dates to a date integer.
  const min = Date.parse(from);
  const max = Date.parse(to);

  const pdfData = [];
  // Continue after all files are parsed.
  for await (let data of promisesOfData) {
    // Parse the date period of the data in the file.
    const i = data.findIndex(el => el === 'period:');
    const start = Date.parse(data[i + 1]);
    const end = Date.parse(data[i + 3]);
    // If the period is between the target dates...
    if (start >= min && end <= max) {
      pdfData.push(data); // ...append the data.
    }
  }
  return pdfData;
}


export function filterData(arrayOfArrays) {
  let filteredData = [];
  for (let array of arrayOfArrays) {
    const start = array.findIndex(el => el === 'any') + 1;
    const end = array.findIndex(el => el === 'Total');
    filteredData = [...filteredData, ...array.slice(start, end)];
  }
  return filteredData;
} 


class ArrayClassifier {
  constructor(array, parentStrategy, parentChecker, childStrategy, expectedChilds, cleanUp, logger) {
    this.array = array;
    this.parentStrategy = parentStrategy;
    this.parentChecker = parentChecker;
    this.childStrategy = childStrategy;
    this.expectedChilds = expectedChilds
    this.cleanUp = cleanUp;
    this.logger = logger;
    this.log = []; // To log the ignored reagents.
    this.currParent; // To which reagent the numbers belong to.
    this.prevParent; // For error handling.
    this.skip = false; // Don't skip by default.
    this.currChild = expectedChilds.length; // Initial value for error handling.
  }
  
  parse() {
    let output = {}; // Return value accumulator.
    for (let element of this.array) {
      if (this.parentChecker(element)) {
        this.parentStrategy(element, output);
      } else {
        this.childStrategy(element, output);
      }
    }
    this.cleanUp();
    this.logger();
    return output;
  }
}


function rvoCheck(string) {
  return isNaN(string);
}


function rvoStrategy(string, accumulator) {
  /* Skip reagents that are not on the database
  and log them to the console */
  if (!quimiosNames[string]) {
    this.skip = true; // Program to skip numbers.
    this.currChild = 0; // Clean up before skipping reagent.
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
    const consumption = +string
    if (consumption) {
      accumulator[this.currParent] // Access the reagent.
      [this.expectedChilds[this.currChild]] // Access the column name.
      += consumption; // And sum the value.
    }

    this.currChild++;
    this.prevParent = this.currParent;

  }
}


function consumosCleanUp() {
  checkCols(this.currChild, this.expectedChilds, this.prevParent);
}


function consumosLogger() {
  if (this.log) {
    console.log('\nSe ignoraron', ...this.log, 'debido a que no están en la base de datos.');
  }
}

export function classifyConsumos(array, cols) {
  const consumosOrganizer = new ArrayClassifier(array, rvoStrategy, rvoCheck, consumosStrategy, cols, consumosCleanUp, consumosLogger);
  return consumosOrganizer.parse();
}


export function organizeConsumos(stringArray, cols = ['px', 'rep', 'qc', 'man']) {
  /* Parses an array of string data and binds 
  the numeric data to it's previous string, 
  which would be the reagent's name. */
  
  // Initialize counters and trackers.
  const consumos = {}; // Return value accumulator.
  const ignored = []; // To log the ignored reagents.
  let currRvo; // To which reagent the numbers belong to.
  let prevRvo; // For error handling.
  let skipRvo = false; // Don't skip by default.
  let currCol = cols.length; // Initial value for error habdling.

  for (let string of stringArray) {
    
    // NAME CASE
    
    /* If it's not a number, it's probably a reagent,
    since we already filtered the data. */
    if (isNaN(string)) {
      
      /* Skip reagents that are not on the database
      and log them to the console */
      if (!quimiosNames[string]) {
        skipRvo = true; // Program to skip numbers.
        currCol = 0; // Clean up before skipping reagent.
        ignored.push(string);
        continue; // Continue to numbers and skip them in their loop cycle.
      }
      
      /* At the start of every non-skippable reagent row, 
      check the number of columns of the previous row. */
      checkCols(currCol, cols, prevRvo);
      currCol = 0; // Then set the columns to 0.
      skipRvo = false; // And cancel skip.
      
      // Get the QUIMIOS name of the reagent
      currRvo = quimiosNames[string];
      
      /* If the reagent is not defined, assign 
      it to an empty object at 0 consumption. */
      consumos[currRvo] ??= objAtZeroFactory(cols);
      
      continue; // Skip the numbers part.
    }
    
    // NUMBER CASE
    
    // Check if the reagent should be skipped.
    if (skipRvo) {
      currCol++;
      prevRvo = currRvo;
    } else {    
      // Coerse string into numeric.
      const consumption = +string
      if (consumption) {
        consumos[currRvo] // Access the reagent.
        [cols[currCol]] // Access the column name.
        += consumption; // And sum the value.
      }
      currCol++;
      prevRvo = currRvo;
    }

  }
  
  /* This check is necessary for the last reagent since 
  it's normally checked at the beggining of next reagent. */
  checkCols(currCol, cols, prevRvo);
  
  if (ignored) {
    console.log('\nSe ignoraron', ...ignored, 'debido a que no están en la base de datos.');
  }

  return consumos;
}


// HTML parsers:

// (For all functions, $ stands for a cheerio HTML parser function)

export function getRows($) {
  const rows = {};
  $('.wd090').each((i, e) => {
    const rvo = $(e).text();
    const row = $(e).attr('id').slice(38, 40);
    rows[rvo] = row;
  });
  return rows;
}