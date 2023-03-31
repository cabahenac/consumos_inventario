import axios from "axios";
import querystring from 'querystring';

export async function getCookie() {
  // GET request to get a session cookie.
  return (await axios.get('http://172.16.0.117')) // Await the response.
    .headers // Then access the headers which contains an AxiosHeaders object,
    ['set-cookie'] // access the set-cookie key which contains an array 
    [0] // and access the single string which contains cookie data separated by ";".
    .split(';') // Lastly split the string
    [0]; // and get the first element which is the session id.
}


export async function post(config, specificData, sessionCookie) {
  const data = querystring.stringify({...config.commonData, ...specificData});
  const response = await axios.post(
    'http://172.16.0.117/' + config.uri,
    data,
    { headers: { Cookie: sessionCookie } },
  );
  return response.data;
}