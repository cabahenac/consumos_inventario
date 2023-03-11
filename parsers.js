import { PdfDataParser } from 'pdf-data-parser';
import { readdir } from 'fs/promises';
import quimiosNames from './quimios-names.js';
import { checkCols } from './utils.js';
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
  let newRvo = {};
  cols.forEach(col => newRvo[col] = 0);
  let prevRvo;
  let currRvo;
  let currCol = 2;

  for (let string of stringArray) {
    /* If it's not a number, it's probably a reagent,
    since we already filtered the data. */
    if (isNaN(string)) {
      /* At the start of every reagent row, check 
      the number of columns of the previous row. */
      //checkCols(currCol, cols, prevRvo);
      // Get the QUIMIOS name of the reagent
      currRvo = quimiosNames[string];
      /* If the reagent is not defined, assign 
      it to an empty object at 0 consumption. */
      consumos[currRvo] ??= newRvo;
      currCol = 0
      console.log(consumos);
      continue
    }
    // Coerse string into numeric.
    const consumption = +string
    if (consumption) {
      consumos[currRvo] // Access the reagent.
      [cols[currCol]] // Access the column name.
      += consumption; // And sum the value.
      console.log(consumos);
    }
    // After each number found, update currCol.
    currCol++;
    /* And keep track of this reagent 
    before it changes in the next loop. */
    prevRvo = currRvo;
  }
  //checkCols(currCol, cols, prevRvo);
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

organizeConsumos(['ACVALPMT', '0',        '0',        '2',        '0',       'AFP_MTY',
'0',        '0',        '2',        '0',        'BHCGMTY', '2',
'0',        '2',        '0',        'CA125MTY', '1',       '0',
'2',        '0',        'CA199MTY', '1',        '0',       '2',
'0',        'CEA2MTY',  '1',        '0',        '2',       '0',
'CORSMTY',  '10',       '0',        '2',        '0',       'ESTTOMTY',
'2',        '0',        '0',        '0',        'E2MTY',   '6',
'0',        '2',        '0',        'FERR_MTY', '0',       '0',
'2',        '0',        'FSHMTY',   '6',        '0',       '2',
'0',        'INSULMTY', '8',        '0',        '2',       '0',
'IRI_MTY',  '3',        '0',        '0',        '0',       'ITLMTY',
'19',       '0',        '0',        '0',        'LHMTY',   '5',
'0',        '2',        '0',        'PROGMTY',  '3',       '0',
'2',        '0',        'PROLMTY',  '8',        '0',       '2',
'0',        'PSALIBMT', '1',        '0',        '2',       '0',
'PSATOTMT', '3',        '0',        '2',        '0',       'TETOTMTY',
'5',        '0',        '2',        '0',]).then(log);