import axios from 'axios';
import querystring from 'querystring';
import * as cheerio from 'cheerio';
import parsePdf from './parse-pdf.js';
import getRvosIds from './get-rvos-ids.js';
import loginQuimios from './login-quimios.js';
import { consumosSavePostReqBody } from './req-bodies.js';

(async () => {
  const sessionCookie = await loginQuimios('cbahena', 'alpe58');

  const res = await axios.post(
    'http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx',
    querystring.stringify({
      ...consumosSavePostReqBody,
    }),
    { headers: { Cookie: sessionCookie } },
  );

  console.log(res.data);
})();