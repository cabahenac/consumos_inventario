import { PdfDataParser } from 'pdf-data-parser';
import { readdir } from 'fs/promises';
import quimiosNames from './quimios-names.js';


// PDF parsers:


function period(data) {
  /* Parses an array of strings, if it finds [
      'period:',
      date1,
      '-',
      date2,
    ] then returns [date1, date2].*/
  const i = index('period:', data);
  return [
    Date.parse(data[i + 1]), 
    Date.parse(data[i + 3]),
  ];
}


async function parsePdf(file) {
  const parser = new PdfDataParser({ url: file });
  const parsedPdf = await parser.parse();
  /* PdfDataParser.parse() returns a promise
    of an array of arrays of string data*/
  const data = parsedPdf[0][0] // Access the string
    .split(' '); // and split it by whitespace.
  return data
}


async function getPdfData(from, to) {
  // Read directory and get all file names.
  let files = await readdir('./pdf');

  // Filter PDF files.
  files = files.filter(file => file.endsWith('.pdf'));
  
  // Queue a promise of parsing each file.
  const promisesOfData = files.map(
    file => parsePdf('./pdf/' + file)
  );
  
  // Parse from and to dates to a date integer.
  const min = Date.parse(from)
  const max = Date.parse(to)

  const pdfData = []
  // Continue after all files are parsed.
  for await (let data of promisesOfData) {
    // Parse the date period of the data in the file.
    const i = data.findIndex(el => el == 'period:');
    const start = Date.parse(data[i + 1]);
    const end = Date.parse(data[i + 3]);
    // If the period is between the target dates...
    if (start >= min && end <= max) {
      pdfData.push(data); // ...append the data.
    }
  }
  return pdfData;
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


