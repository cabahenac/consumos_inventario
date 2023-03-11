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


export async function organizeConsumos(stringArray) {
  /* Parses an array of string data and binds 
  the numeric data to it's previous string, 
  which would be the reagent's name. */
  const consumos = {};
  const cols = ['px', 'rep', 'qc', 'man'];
  let prevRvo;
  let currRvo;
  let currCol = cols.length;
  let skipRvo = false;

  for (let string of stringArray) {
    /* If it's not a number, it's probably a reagent,
    since we already filtered the data. */
    if (isNaN(string)) {
      /* Skip reagents that are not on the database
      and log them to the console */
      if (!quimiosNames[string]) {
        skipRvo = true; // Program to skip consumos.
        currCol = 0; // Clean up.
        console.log(`El reactivo ${string} no está en la base de datos. Se ignorarán los consumos.`);
        continue; // Continue to numbers but skip them in their if block.
      }
      /* At the start of every reagent row, check 
      the number of columns of the previous row. */
      checkCols(currCol, cols, prevRvo);
      currCol = 0;
      // Get the QUIMIOS name of the reagent
      skipRvo = false;
      currRvo = quimiosNames[string];
      /* If the reagent is not defined, assign 
      it to an empty object at 0 consumption. */
      consumos[currRvo] ??= objAtZeroFactory(cols);
      continue;
    }
    // After each number found, update currCol.
    currCol++;
    /* And keep track of this reagent 
    before it changes in the next loop. */
    prevRvo = currRvo;
    // Check if the reagent should be skipped.
    if (skipRvo) {
      continue;
    }
    // Coerse string into numeric.
    const consumption = +string
    if (consumption) {
      consumos[currRvo] // Access the reagent.
      [cols[currCol]] // Access the column name.
      += consumption; // And sum the value.
    }
  }
  checkCols(currCol, cols, prevRvo);
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