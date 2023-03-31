import { load } from 'cheerio';
import { post, getCookie } from './inventory/application/requests.js';
import { getConsumos, filterData } from './consumos/application/parsers.js';
import { classifyConsumos } from './consumos/application/classify-consumos.js';
import { calculate, getTotal, getPx, addCols, getCals, getExceptions } from './consumos/application/calculations.js';
import { reqConfig } from './inventory/domain/config.js';
import { getRows, getInventory, getMetaValues } from './inventory/application/parsers.js';
import { enoughInventory, logInsufficientInventory } from './shared/application/calculations.js';
import { colNames, generateInputValues } from './inventory/application/gen-input-val.js';


const user = {
  Login1$UserName: 'cbahena',
  Login1$Password: 'alpe58',
};


function dateMX(date) {
  return `${date.slice(8)}/${date.slice(5,7)}/${date.slice(0,4)}`
}


function dateUS(date) {
  return `${date.slice(5,7)}/${date.slice(8)}/${date.slice(0,4)}`
}


function objToArr(obj) {
  delete obj.to;
  delete obj.from;
  let arr = ['CLORO-S', 'CLORO-S', 'CLORO-S'];
  for (let el in obj) {
    if (el !== 'Seleccione') {
      arr.push(obj[el]);
    }
  }
  console.log(arr);
  return arr;
}


const exceptions = {}

export default async function captureConsumos(body) {

  let { from, to } = body;
  let listOfCalibrations = objToArr(body);
  let searchParams = {
    ctl00$ContentMasterPage$txtDesdeB: dateMX(to),
    ctl00$ContentMasterPage$cmbEquipo: 6,
    ctl00$ContentMasterPage$cmbMesaOrdenac: 2,
  };

  async function getQuimiosData() {
    const cookie = await getCookie();
    
    await post(reqConfig.login, user, cookie);
    
    const html = load(await post(reqConfig.search, searchParams, cookie));
    
    return [html, cookie];
  }

  let [[html, cookie], consumos] = await Promise.all([
    getQuimiosData(), 
    getConsumos(dateUS(to), dateUS(from)),
  ]);

  const rows = getRows(html);
  const inventory = getInventory(html, rows);
  const metaValues = getMetaValues(html, rows);
  
  consumos = filterData(consumos);
  consumos = classifyConsumos(consumos, ['res', 'rep', 'qc', 'man']);
  consumos = calculate(
    consumos, 
    [
      getTotal, 
      getPx, 
      addCols], 
    {
      cals: { func: getCals , params: listOfCalibrations },
      excep: { func: getExceptions, params: exceptions },
    }
  );
  
  const [toCapture, toLog] = enoughInventory(inventory, consumos);
  logInsufficientInventory(toLog)
  const inputValues = generateInputValues(toCapture, rows, colNames);

  const res = post(reqConfig.save, {...inputValues, ...metaValues, ...searchParams}, cookie)
  
  return res.data;
}
