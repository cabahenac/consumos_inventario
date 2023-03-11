import {load} from 'cheerio';
import { post, getCookie, reqConfig, domain } from './requests.js';
import { getPdfData, filterData, getRows, organizeConsumos } from './parsers.js';


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
  console.log(rows);
  
  let consumos = await getPdfData('03/03/2023', '03/08/2023');
  consumos = filterData(consumos);
  consumos = await organizeConsumos(consumos);
  console.log(consumos);
})();