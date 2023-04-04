import { load } from 'cheerio';
import { post, getCookie } from './requests.js';
import { getConsumos, filterData } from './parsers.js';
import { classifyConsumos } from './classify-consumos.js';
import { calculate, getTotal, getPx, addCols, getCals, getCanc, getQCAMSCorrection, getPxAMSCorrection } from './calculations.js';
import { reqConfig } from '../domain/config.js';
import { getRows, getInventory, getMetaValues } from './parsers.js';
import { enoughInventory, logInsufficientInventory } from './calculations.js';
import { colNames, generateInputValues } from './gen-input-val.js';


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


function objToArr(obj, filter) {
  let arr = [];
  for (let el in obj) {
    if (obj[el] !== 'Seleccione' && el.startsWith(filter)) {
      arr.push(obj[el]);
    }
  }
  return arr;
}

export default async function captureConsumos(body) {

  let { from, to } = body;
  let listOfCalibrations = [...objToArr(body, 'cal'), 'CLORO-S', 'CLORO-S', 'CLORO-S'];
  let cancelations = objToArr(body, 'canc')
  console.log(listOfCalibrations, cancelations);
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
    getConsumos(dateUS(from), dateUS(to)),
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
      getPxAMSCorrection,
      addCols,
      getQCAMSCorrection, 
    ], 
    {
      cals: { func: getCals , params: listOfCalibrations },
      canc: { func: getCanc, params: { inv: inventory, canc: cancelations, htmlParser: html, rows: rows } },
    }
  );
  
  const [toCapture, toLog] = enoughInventory(inventory, consumos);
  logInsufficientInventory(toLog)
  const inputValues = generateInputValues(toCapture, rows, colNames);
  const res = post(reqConfig.save, {...inputValues, ...metaValues, ...searchParams}, cookie)
  
  return res.data;
}
