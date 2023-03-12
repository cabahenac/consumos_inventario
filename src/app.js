import {load} from 'cheerio';
import { post, getCookie } from './inventory/application/requests.js';
import { getConsumos, filterData } from './consumos/application/parsers.js';
import { classifyConsumos } from './consumos/application/classify-consumos.js';
import { getTotals } from './consumos/application/calculations.js';
import { domain, reqConfig } from './inventory/domain/config.js';
import { getRows, getInventory } from './inventory/application/parsers.js';
import { enoughInventory } from './shared/application/calculations.js';

const user = {
  Login1$UserName: 'cbahena',
  Login1$Password: 'alpe58',
};

const searchParams = {
  ctl00$ContentMasterPage$txtDesdeB: '07/03/2023',
  ctl00$ContentMasterPage$cmbEquipo: 6,
  ctl00$ContentMasterPage$cmbMesaOrdenac: 2,
};


(async () => {

  const cookie = await getCookie(domain);

  await post(reqConfig.login, user, cookie);

  const $ = load(await post(reqConfig.search, searchParams, cookie));

  const rows = getRows($);
  const inventory = getInventory($, rows);
  
  let consumos = await getConsumos('03/03/2023', '03/08/2023');
  consumos = filterData(consumos);
  consumos = classifyConsumos(consumos, ['px', 'rep', 'qc', 'man']);
  consumos = getTotals(consumos);
  
  const [toCapture, toLog] = enoughInventory(inventory, consumos);
  console.log(toCapture);
  console.log(toLog);
})();