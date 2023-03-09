import { PdfDataParser } from 'pdf-data-parser';
import quimiosNames from './quimios-names.js';

function index(searchFor) {
  // Searches for a word and returns it's index.
  for (let i=0; i<data.length; i++) {
    if (data[i] === searchFor) return i;
  }
}



// For all functions, $ stands for a cheerio HTML parser function.

export function getRows($) {
  const rows = {};
  $('.wd090').each((i, e) => {
    const rvo = $(e).text();
    const row = $(e).attr('id').slice(38, 40);
    rows[rvo] = row;
  });
  return rows;
}

