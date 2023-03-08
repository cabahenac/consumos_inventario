import axios from 'axios';
import querystring from 'querystring';
import reqConfig from './requests.js';


export async function searchReq(sessionCookie) {
  // POST request with the session cookie in the headers.
  const res = await axios.post(
    'http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx',
    querystring.stringify({
      ...reqBody.search,
    }),
    { headers: { Cookie: sessionCookie } },
  );
  
  return res.data;
}

export async function saveReq(sessionCookie) {
  
  const res = await axios.post(
    'http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx',
    querystring.stringify({
      ...reqBody.save,
    }),
    { headers: { Cookie: sessionCookie } },
    );

}