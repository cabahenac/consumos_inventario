

export function enoughInventory(inventory, consumos) {
  let enough = {};
  let notEnough = {};
  
  for (let key in inventory) {
    if (!consumos[key]) continue;
    if (inventory[key] >= consumos[key].total) {
      enough[key] = consumos[key];
    } else {
      notEnough[key] = {};
      notEnough[key].inventory = inventory[key];
      notEnough[key].consumo = consumos[key].total;
    }
  }

  return [enough, notEnough];
}

let inventory = {
  'FOSF-ALCAL': 1070,
  'AC. VALP': 178,
  'CLORO-OR': 57081,
  'CLORO-S': 57081,
  AFP: 142,
  'ALBUMINA-SUERO': 619,
  'AMILASA-S': 181,
  'PCR-ULTRA': 525,
  'BETA-HCG': 173,
  'BILIRR-DIR': 516,
  'CA-125': 153,
  'CA-153': 129,
  'CA-199': 81,
  TU: 462,
  TGP: 316,
  TGO: 400,
  C3: 200,
  C4: 301,
  'Ca-OR': 525,
  'Ca-S': 525,
  'COLEST-TOT': 1486,
  'CREATININA-OR': 937,
  'CREATININA-S': 937,
  GGTP: 526,
  'GLUCOSA-OR': 687,
  'GLUCOSA-S': 687,
  'Hb-GLIC': 381,
  IgA: 370,
  IgG: 396,
  IgM: 483,
  DHL: 531,
  'Mg-OR': 644,
  'Mg-SERICO': 644,
  'PROT-TOT-S': 306,
  'BILIRR-TOT': 536,
  TRF: 557,
  TRIGLICERIDOS: 1082,
  'COLEST-HDL': 375,
  'NITROG URE': 818,
  'AC. URICO-OR': 444,
  'AC. URICO-S': 444,
  CEA2: 116,
  'CORTISOL-OR': 137,
  E2: 57,
  FERR: 98,
  FSH: 131,
  INSULINA: 37,
  LH: 207,
  LIPASA: 283,
  'AMONIO-PL': 0,
  'FE SERICO': 249,
  'FOSFOR-OR': 1947,
  'FOSFOR-S': 1947,
  PROG: 163,
  PROL: 7,
  'PSA-LIBRE': 219,
  'PSA-TOTAL': 372,
  IgE: 249,
  'CAP. FIJ. Fe': 1158,
  'T3-LIBRE': 326,
  'T3-TOTAL': 417,
  'T4-LIBRE': 210,
  'T4-TOTAL': 421,
  'TEST-TOTAL': 57,
  TSH: 528,
}

let consumos = {
  'AC. VALP': { px: 0, rep: 0, qc: 2, man: 0, total: 4 },
  AFP: { px: 0, rep: 0, qc: 2, man: 0, total: 4 },
  'BETA-HCG': { px: 2, rep: 0, qc: 2, man: 0, total: 8 },
  'CA-125': { px: 1, rep: 0, qc: 2, man: 0, total: 6 },
  'CA-199': { px: 1, rep: 0, qc: 2, man: 0, total: 6 },
  CEA2: { px: 1, rep: 0, qc: 2, man: 0, total: 6 },
  'CORTISOL-OR': { px: 10, rep: 0, qc: 2, man: 0, total: 24 },
  E2: { px: 6, rep: 0, qc: 2, man: 0, total: 16 },
  FERR: { px: 0, rep: 0, qc: 2, man: 0, total: 4 },
  FSH: { px: 6, rep: 0, qc: 2, man: 0, total: 16 },
  INSULINA: { px: 8, rep: 0, qc: 2, man: 0, total: 20 },
  LH: { px: 5, rep: 0, qc: 2, man: 0, total: 14 },
  PROG: { px: 3, rep: 0, qc: 2, man: 0, total: 10 },
  PROL: { px: 8, rep: 0, qc: 2, man: 0, total: 20 },
  'PSA-LIBRE': { px: 1, rep: 0, qc: 2, man: 0, total: 6 },
  'PSA-TOTAL': { px: 3, rep: 0, qc: 2, man: 0, total: 10 },
  'TEST-TOTAL': { px: 5, rep: 0, qc: 2, man: 0, total: 14 },
  TSH: { px: 52, rep: 1, qc: 2, man: 0, total: 110 },
  TU: { px: 19, rep: 0, qc: 2, man: 0, total: 42 },
  'T3-LIBRE': { px: 31, rep: 0, qc: 2, man: 0, total: 66 },
  'T3-TOTAL': { px: 47, rep: 0, qc: 2, man: 0, total: 98 },
  'T4-LIBRE': { px: 35, rep: 0, qc: 2, man: 0, total: 74 },
  'T4-TOTAL': { px: 47, rep: 0, qc: 3, man: 0, total: 100 },
  'AC. URICO-S': { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  'ALBUMINA-SUERO': { px: 19, rep: 0, qc: 8, man: 0, total: 54 },
  'AMILASA-S': { px: 15, rep: 0, qc: 8, man: 0, total: 46 },
  'BILIRR-DIR': { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  'BILIRR-TOT': { px: 19, rep: 0, qc: 8, man: 0, total: 54 },
  'Ca-S': { px: 21, rep: 0, qc: 8, man: 0, total: 58 },
  'CLORO-S1': { px: 22, rep: 0, qc: 8, man: 0, total: 60 },
  'COLEST-HDL': { px: 18, rep: 0, qc: 6, man: 0, total: 48 },
  'COLEST-TOT': { px: 19, rep: 0, qc: 8, man: 0, total: 54 },
  'CREATININA-S': { px: 19, rep: 0, qc: 8, man: 0, total: 54 },
  C3: { px: 6, rep: 0, qc: 6, man: 0, total: 24 },
  C4: { px: 6, rep: 0, qc: 6, man: 0, total: 24 },
  DHL: { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  'FE SERICO': { px: 31, rep: 0, qc: 10, man: 0, total: 82 },
  'FOSF-ALCAL': { px: 19, rep: 0, qc: 10, man: 0, total: 58 },
  'FOSFOR-S': { px: 20, rep: 0, qc: 8, man: 0, total: 56 },
  GGTP: { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  'GLUCOSA-S': { px: 21, rep: 3, qc: 8, man: 2, total: 68 },
  IgA: { px: 6, rep: 0, qc: 7, man: 0, total: 26 },
  IgE: { px: 6, rep: 0, qc: 6, man: 0, total: 24 },
  IgG: { px: 6, rep: 0, qc: 6, man: 0, total: 24 },
  IgM: { px: 6, rep: 0, qc: 6, man: 0, total: 24 },
  LIPASA: { px: 0, rep: 0, qc: 4, man: 0, total: 8 },
  'Mg-SERICO': { px: 12, rep: 0, qc: 8, man: 0, total: 40 },
  'NITROG URE': { px: 18, rep: 0, qc: 10, man: 0, total: 56 },
  'PCR-ULTRA1': { px: 0, rep: 0, qc: 7, man: 0, total: 14 },
  'PCR-ULTRA2': { px: 3, rep: 0, qc: 6, man: 0, total: 18 },
  'CLORO-S2': { px: 22, rep: 0, qc: 8, man: 0, total: 60 },
  'PROT-TOT-S': { px: 19, rep: 0, qc: 8, man: 0, total: 54 },
  'CLORO-S3': { px: 22, rep: 0, qc: 8, man: 0, total: 60 },
  TGO: { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  TGP: { px: 18, rep: 0, qc: 10, man: 0, total: 56 },
  TRF: { px: 4, rep: 0, qc: 6, man: 0, total: 20 },
  TRIGLICERIDOS: { px: 18, rep: 0, qc: 8, man: 0, total: 52 },
  'CAP. FIJ. Fe': { px: 15, rep: 0, qc: 8, man: 0, total: 46 },
  'DIMERO D': { px: 1, rep: 0, qc: 2, man: 0, total: 6 },
}


let [toCapture, toLog] = enoughInventory(inventory, consumos);

console.log(toCapture);
console.log(toLog);