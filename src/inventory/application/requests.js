import axios from "axios";
import querystring from 'querystring';

export async function getCookie() {
  // GET request to get a session cookie.
  return (await axios.get(process.env.DOMAIN)) // Await the response.
    .headers // Then access the headers which contains an AxiosHeaders object,
    ['set-cookie'] // access the set-cookie key which contains an array 
    [0] // and access the single string which contains cookie data separated by ";".
    .split(';') // Lastly split the string
    [0]; // and get the first element which is the session id.
}


export async function post(config, specificData, sessionCookie) {
  const data = querystring.stringify({...config.commonData, ...specificData});
  const response = await axios.post(
    process.env.DOMAIN + config.uri,
    data,
    { headers: { Cookie: sessionCookie } },
  );
  return response.data;
}


export async function x(config, specificData, sessionCookie) {
  const data = {...config.commonData, ...specificData};
  console.log(
    process.env.DOMAIN + config.uri,
    data,
    { headers: { Cookie: sessionCookie } },
  );
}
