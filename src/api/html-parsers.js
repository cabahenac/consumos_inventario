import { load } from "cheerio";
import { post, getCookie } from "./requests.js";
import { reqConfig } from "../data/config.js";

const consumosPrefixId = "#ctl00_ContentMasterPage_grdConsumo_ctl";
const consumosPrefixName = "ctl00$ContentMasterPage$grdConsumo$ctl";

export async function getQuimiosData(user, searchParams) {
  const cookie = await getCookie();

  await post(reqConfig.login, user, cookie);

  const html = load(await post(reqConfig.search, searchParams, cookie));

  return [html, cookie];
}

export function getRows(htmlParser) {
  const rows = {};
  htmlParser(".wd090").each((i, e) => {
    const rvo = htmlParser(e).text();
    const row = htmlParser(e).attr("id").slice(38, 40);
    rows[rvo] = row;
  });
  return rows;
}

export function getInventory(htmlParser, rows) {
  let inventory = {};
  for (let rvo in rows) {
    inventory[rvo] = +htmlParser(
      `${consumosPrefixId}${rows[rvo]}_lblExistFinal`
    ).text();
  }

  return inventory;
}

export function getMetaValues(htmlParser, rows) {
  const fixedValues = {
    $chkQueProveedor: "on",
    $txtValidacionCapMGrd: 0,
    $txtSinIdentificarCapMGrd: 0,
    $cmbMotSinIdentificarGrd: "[Seleccione]",
  };

  let metaValues = {};
  for (let rvo in rows) {
    metaValues[`${consumosPrefixName}${rows[rvo]}$hfIDProducto`] = +htmlParser(
      `${consumosPrefixId}${rows[rvo]}_hfIDProducto`
    ).attr("value");
    for (let metaName in fixedValues) {
      metaValues[`${consumosPrefixName}${rows[rvo]}${metaName}`] =
        fixedValues[metaName];
    }
  }

  return metaValues;
}
