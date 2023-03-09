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
    const [start, end] = period(data);
    // If the period is between the target dates...
    if (start >= min && end <= max) {
      pdfData.push(data); // ...append the data.
    }
  };

  return pdfData;
}


(async () => {
  getPdfData('03/03/2023', '03/08/2023');
})();
