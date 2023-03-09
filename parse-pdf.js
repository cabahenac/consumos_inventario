


export default async function parsePdf(file) {
  const parser = new PdfDataParser({ url: file });
  
  // Parse PDF, get the relevant data and split it by columns (spaces).
  let data = (await parser.parse())[0][0].split(' ');

  // Find the words that mark the beggining and the end of the relevant data and filter the data.
  data = data.slice(index('any') + 1, index('Total'));
  
  // Turn the array into an object of reagents contanining the reagent consumption numbers.
  let consumos = {};
  let currentRvo = '';
  for (let el of data) {
    if (isNaN(el)) {                // If it's not a number, it means it's a reagent;
      const rvo = quimiosNames[el]; // then get the QUIMIOS name of the reagent,
      consumos[rvo] = [];           // assign the reagent name to a key with an empty array as value
      currentRvo = rvo;             // and keep track of the current reagent to whom the next numbers belong.
    } else { // Push the number to the current reagent consumption list.
      consumos[currentRvo].push(+el);
      // Check if there there are more columns than expected.
    }
  }
  
  // Check if the object has the right structure.
  for (let rvo in consumos) {
    if (consumos[rvo].length !== 4) {
      throw new Error(`Failed to parse PDF, ${consumos[rvo].length < 4 ? "less" : "more"} columns than expected.`)
    }
  }

  // Delete undefined key.
  delete consumos[undefined]

  return consumos;
};