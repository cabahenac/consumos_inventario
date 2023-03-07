import axios from 'axios';
import querystring from 'querystring';
import { loginPostReqBody } from './req-bodies.js';


export async function getCookie(domain) {
  // GET request to get a cookie.
  return (await axios.get(domain)) // Await the response.
    .headers // Then access the headers which contains an AxiosHeaders object,
    ['set-cookie'] // access the set-cookie key which contains an array 
    [0] // and access the single string which contains cookie data separated by ";".
    .split(';') // Lastly split the string
    [0]; // and get the first element which is the session id.
}


export default async function loginQuimios(username, password) {
  // Get a session cookie.
  const cookie = await getCookie('http://172.16.0.117/');

  // POST username and password.
  const res = await axios.post(
    'http://172.16.0.117/Login.aspx',
    querystring.stringify({
      ...loginPostReqBody,
      Login1$UserName: username,
      Login1$Password: password,
    }),
    { headers: { Cookie: cookie } },
  );
    
  return cookie;
}