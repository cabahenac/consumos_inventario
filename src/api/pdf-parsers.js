import { PdfDataParser } from "pdf-data-parser";
import { readdir } from "fs/promises";

async function readPdf(file) {
  const parser = new PdfDataParser({ url: file });
  const parsedPdf = await parser.parse();
  /* PdfDataParser.parse() returns a promise
    of an array of arrays of string data*/
  const data = parsedPdf[0][0] // Access the string
    .split(" "); // and split it by whitespace.
  return data;
}

export async function getConsumos(from, to) {
  // Read directory and get all file names.
  let files = await readdir("C:/Users/monterrey1/Desktop");

  // Filter PDF files.
  files = files.filter((file) => file.endsWith(".pdf"));

  // Queue a promise of parsing each file.
  const promisesOfData = files.map((file) =>
    readPdf("C:/Users/monterrey1/Desktop/" + file)
  );

  // Parse from and to dates to a date integer.
  const min = Date.parse(from);
  const max = Date.parse(to);

  const pdfData = [];
  // Continue after all files are parsed.
  for await (let data of promisesOfData) {
    // Parse the date period of the data in the file.
    const i = data.findIndex((el) => el === "period:");
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
    const start = array.findIndex((el) => el === "any") + 1;
    const end = array.findIndex((el) => el === "Total");
    filteredData = [...filteredData, ...array.slice(start, end)];
  }
  return filteredData;
}
