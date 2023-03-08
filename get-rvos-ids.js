import axios from 'axios';
import querystring from 'querystring';
import * as cheerio from 'cheerio';
import loginQuimios from './login-quimios.js';
import { consumosSearchPostReqBody } from './req-bodies.js';

const prefix = 'ctl00$ContentMasterPage$grdConsumo$ctl';
const suffix = {
  checkbox: 'chkQueProveedor',
  
};

export default async function getRvosIds() {
  const sessionCookie = await loginQuimios('cbahena', 'alpe58');
  
  // POST request with the session cookie in the headers.
  const res = await axios.post(
    'http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx',
    querystring.stringify({
      ...consumosSearchPostReqBody,
    }),
    { headers: { Cookie: sessionCookie } },
  );
  
  // Load the HTML response to the cheerio $ function.
  const $ = cheerio.load(res.data);

  // Grab each reagent name and it's row number.
  const rows = {};
  $('.wd090').each((i, e) => {
    const rvo = $(e).text();
    const row = $(e).attr('id').slice(38, 40);
    rows[rvo] = row;
  });

  const rvosMetaData = {}
  for (let rvo in rows) {
    rvosMetaData[rvo] = {}
    rvosMetaData[rvo][prefix + rows[rvo] + suffix.checkbox] = 'on'
  }

  const consumosPostReqData = {};
  for (let rvo in rvosMetaData) {
    Object.assign(consumosPostReqData, rvosMetaData[rvo]);
  }

  console.log(consumosPostReqData);
}