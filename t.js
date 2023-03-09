import { PdfDataParser } from 'pdf-data-parser';
import { readdir } from 'fs/promises';

function index(searchFor, searchIn) {
  // Searches for a word and returns it's index.
  for (let i=0; i<searchIn.length; i++) {
    if (searchIn[i] === searchFor) return i;
  }
}


function period(data) {
  const i = index('period:', data);
  return [
    Date.parse(data[i + 1]), 
    Date.parse(data[i + 3]),
  ];
}


async function parsePdf(file) {
  const parser = new PdfDataParser({ url: file });
  return (await parser.parse())[0][0].split(' ');
}


async function getPdfData(from, to) {
  const files = await readdir('./pdf');
  
  const pdfData = files.map(file => {
    parsePdf('./pdf/' + file).then(data => {
      const [start, end] = period(data);
      const min = Date.parse(from)
      const max = Date.parse(to)
      
      if (start >= min && end <= max) {
        return data;
      }
    });
  });
  console.log(pdfData);
  return pdfData
}


(async () => {
  getPdfData('03/03/2023', '03/08/2023');
})();
