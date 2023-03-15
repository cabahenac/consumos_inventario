import {html, load} from 'cheerio';
import { post, getCookie, x } from './inventory/application/requests.js';
import { getConsumos, filterData } from './consumos/application/parsers.js';
import { classifyConsumos } from './consumos/application/classify-consumos.js';
import { calculate, getTotal, getPx, addCols, getCals, getExceptions } from './consumos/application/calculations.js';
import { reqConfig } from './inventory/domain/config.js';
import { getRows, getInventory, getMetaValues } from './inventory/application/parsers.js';
import { enoughInventory, logInsufficientInventory } from './shared/application/calculations.js';
import { colNames, generateInputValues, generateZeroInputValues } from './inventory/application/gen-input-val.js';
import dotenv from 'dotenv';
dotenv.config();

const user = {
  Login1$UserName: process.env.USER_NAME,
  Login1$Password: process.env.PASSWORD,
};

const searchParams = {
  ctl00$ContentMasterPage$txtDesdeB: '13/03/2023',
  ctl00$ContentMasterPage$cmbEquipo: 6,
  ctl00$ContentMasterPage$cmbMesaOrdenac: 2,
};


const listOfCalibrations = [
  "CA-199",
  "FSH",
  "INSULINA",
  "T3-LIBRE",
  "BILIRR-DIR",
  "BILIRR-TOT",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CLORO-S",
  "CREATININA-S",
  "CREATININA-S",
  "C3",
  "C4",
  "DHL",
  "FE SERICO",
  "FOSF-ALCAL",
  "IgA",
  "IgG",
  "LIPASA",
  "Mg-SERICO",
  "Mg-SERICO",
  "NITROG URE",
  "PCR-ULTRA",
  "PCR-ULTRA",
  "POTMTY",
  "SODMTY",
  "POTMTY",
  "SODMTY",
  "SODMTY",
  "TGO",
  "TGP",
  "CAP. FIJ. Fe",
];


const exceptions = {
  LH: {
    rep: 2,
  }
}

async function getQuimiosData() {
  const cookie = await getCookie();
  
  await post(reqConfig.login, user, cookie);
  
  const html = load(await post(reqConfig.search, searchParams, cookie));
  
  return [html, cookie];
}



(async () => {

  let [[html, cookie], consumos] = await Promise.all([
    getQuimiosData(), 
    getConsumos('03/11/2023', '03/13/2023'),
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

  post(reqConfig.save, {...inputValues, ...metaValues, ...searchParams}, cookie)

})();