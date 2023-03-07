import axios from 'axios';
import querystring from 'querystring';
import * as cheerio from 'cheerio';
import loginQuimios from './login-quimios.js';
import { consumosSearchPostReqBody } from './req-bodies.js';

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

  // Grab each reagent and make and object to map reagent name to html id.
  const rvosIds = {};
  $('.wd090').each((i, e) => {
    const rvo = $(e).text();
    const id = $(e).attr('id').slice(38, 40);
    rvosIds[rvo] = id;
  });

  return rvosIds;
}