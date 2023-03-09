import axios from 'axios';
import querystring from 'querystring';
import {load} from 'cheerio';
import parsePdf from './parse-pdf.js';
import { post, getCookie, reqConfig, domain } from './requests.js';
import { getRows } from './parsers.js';


(async () => {



  const cookie = await getCookie(domain);

  const user = {
    Login1$UserName: 'cbahena',
    Login1$Password: 'alpe58',
  };

  await post(reqConfig.login, user, cookie);

  const searchParams = {
    ctl00$ContentMasterPage$txtDesdeB: '07/03/2023',
    ctl00$ContentMasterPage$cmbEquipo: 6,
    ctl00$ContentMasterPage$cmbMesaOrdenac: 2,
  };

  const $ = load(await post(reqConfig.search, searchParams, cookie));

  const rows = getRows($);
  console.log(rows);
})();