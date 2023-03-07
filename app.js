import { launch } from 'puppeteer';
import parsePdf from './parse-pdf.js';


const delay = (seconds) => new Promise(r => setTimeout(r, seconds*1000));
// Setup
const browser = await launch({ headless: false });
const page = await browser.newPage();

const ids = {
  user: '#Login1_UserName',
  pass: '#Login1_Password',
  loginBtn: '#Login1_LoginButton',
  date: '#ctl00_ContentMasterPage_txtDesdeB',
  equipo: '#ctl00_ContentMasterPage_cmbEquipo',
  grupo: '#ctl00_ContentMasterPage_cmbMesaOrdenac',
  searchBtn: '#ctl00_ContentMasterPage_btnBuscarEstudio',
};

const equipos = {
  ARCHITECT: {
    value: '6',
    grupo: '2',
  },
  ALINITY: {
    value: '20',
  },
};

export default async function goToConsumos(date, equipo, id, seconds) {

  // Login
  await page.goto('http://172.16.0.117/');
  await page.type(id.user, 'cbahena');
  await page.type(id.pass, 'alpe58');
  await page.click(id.loginBtn);
  // await page.waitForSelector('#ctl00_LinkCerrarSessión');
  
  // GET Web App
  await page.goto('http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx');
  await page.type(id.date, date);
  await page.select(id.equipo, equipo.value);
  await page.waitForSelector(id.grupo + ':not([disabled])');
  await page.select(id.grupo, equipo.grupo);
  await delay(seconds);
  await page.click(id.searchBtn);
  
  // POST consumption data
  await delay(seconds);
  
  const element = await page.waitForSelector('[class=wd90]');
  console.log(element);

}

// const consumptionData = parsePdf('file.pdf');
// console.log(consumptionData);
goToConsumos('05032023', equipos.ARCHITECT, ids, 2);


