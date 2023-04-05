import { post } from "./requests.js";
import { getQuimiosData, getConsumos, filterData } from "./parsers.js";
import { classifyConsumos } from "./classify-consumos.js";
import {
  calculate,
  getTotal,
  getPx,
  addCols,
  getCals,
  getCanc,
  getQCAMSCorrection,
  getPxAMSCorrection,
  getExceptions,
} from "./calculations.js";
import { reqConfig } from "../domain/config.js";
import { getRows, getInventory, getMetaValues } from "./parsers.js";
import { enoughInventory, logInsufficientInventory } from "./calculations.js";
import { generateInputValues } from "./gen-input-val.js";
import { dateMX, dateUS, objToArr } from "./utils.js";

const user = {
  Login1$UserName: "cbahena",
  Login1$Password: "alpe58",
};

export default async function captureConsumos(body) {
  // Get params from the request body.
  let { from, to } = body;
  let searchParams = {
    ctl00$ContentMasterPage$txtDesdeB: dateMX(to),
    ctl00$ContentMasterPage$cmbEquipo: 6,
    ctl00$ContentMasterPage$cmbMesaOrdenac: 2,
  };

  let listOfCalibrations = [
    ...objToArr(body, "cal"),
    "CLORO-S",
    "CLORO-S",
    "CLORO-S",
  ];
  let cancelations = objToArr(body, "canc");
  let exceptions = objToArr(body, "excep");
  console.log(listOfCalibrations, cancelations, exceptions);

  // Fetch the data.
  let [[html, cookie], consumos] = await Promise.all([
    getQuimiosData(user, searchParams),
    getConsumos(dateUS(from), dateUS(to)),
  ]);

  // Get DOM data.
  const rows = getRows(html);
  const inventory = getInventory(html, rows);
  const metaValues = getMetaValues(html, rows);
  // Transform consumos data.
  consumos = filterData(consumos);
  consumos = classifyConsumos(consumos, ["res", "rep", "qc", "man"]);
  consumos = calculate(
    consumos,
    [getTotal, getPxAMSCorrection, addCols, getQCAMSCorrection],
    {
      cals: { func: getCals, params: listOfCalibrations },
      excep: { func: getExceptions, params: exceptions },
      canc: {
        func: getCanc,
        params: {
          inv: inventory,
          canc: cancelations,
          htmlParser: html,
          rows: rows,
        },
      },
    }
  );

  const [toCapture, toLog] = enoughInventory(inventory, consumos);
  logInsufficientInventory(toLog);

  // Post request to save consumos.
  const inputValues = generateInputValues(toCapture, rows);
  const res = post(
    reqConfig.save,
    { ...inputValues, ...metaValues, ...searchParams },
    cookie
  );
  return res.data;
}
