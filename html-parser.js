import * as cheerio from 'cheerio';

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

