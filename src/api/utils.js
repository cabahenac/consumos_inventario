export function dateMX(date) {
  return `${date.slice(8)}/${date.slice(5,7)}/${date.slice(0,4)}`
}


export function dateUS(date) {
  return `${date.slice(5,7)}/${date.slice(8)}/${date.slice(0,4)}`
}


export function objToArr(obj, filter) {
  let arr = [];
  for (let el in obj) {
    if (obj[el] !== 'Seleccione' && el.startsWith(filter)) {
      arr.push(obj[el]);
    }
  }
  return arr;
}