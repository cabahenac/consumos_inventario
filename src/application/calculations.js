import { consumosPerCal } from "../domain/cals.js";
import { pbasPorVial } from "../domain/pbas.js";

export function getTotal(consumos, rvo) {
  consumos[rvo].total = 0;
  for (let col of ["res", "rep", "qc", "man"]) {
    consumos[rvo].total += consumos[rvo][col];
  }
}

export function getPx(consumos, rvo) {
  consumos[rvo].px = consumos[rvo].res - consumos[rvo].man;
}

export function getQCAMSCorrection(consumos, rvo) {
  if (
    ["C3", "C4", "IgG", "IgM", "IgA", "IgE", "PCR-ULTRA", "TRF"].includes(rvo)
  ) {
    consumos[rvo].qc += 2;
  }
}

export function getPxAMSCorrection(consumos, rvo) {
  if (
    ["C3", "C4", "IgG", "IgM", "IgA", "IgE", "PCR-ULTRA", "TRF"].includes(rvo)
  ) {
    if (consumos[rvo].res - consumos[rvo].man >= 2) {
      consumos[rvo].px = consumos[rvo].res - consumos[rvo].man - 2;
      return;
    }
  }

  consumos[rvo].px = consumos[rvo].res - consumos[rvo].man;
}

export function getCals(consumos, listOfCalibrations) {
  for (let rvo of listOfCalibrations) {
    if (!consumos[rvo]) {
      consumos[rvo] = {
        res: 0,
        rep: 0,
        qc: 0,
        man: 0,
        total: 0,
        px: 0,
        cal: 0,
        canc: 0,
        motivo: "[Seleccione]",
      };
    }
    consumos[rvo].cal += consumosPerCal[rvo];
  }
}

export function getExceptions(consumos, exceptions) {
  for (let rvo of exceptions) {
    consumos[rvo].rep += 1;
  }
}

export function getCanc(consumos, params) {
  for (let rvo of params.canc) {
    if (!consumos[rvo]) {
      consumos[rvo] = {
        res: 0,
        rep: 0,
        qc: 0,
        man: 0,
        total: 0,
        px: 0,
        cal: 0,
        canc: 0,
        motivo: "[Seleccione]",
      };
    }

    const existenciaInicial = +params
      .htmlParser(
        `#ctl00_ContentMasterPage_grdConsumo_ctl${params.rows[rvo]}_lblExistInicial`
      )
      .text();
    const consumo = consumos[rvo].total;
    const existenciaFinal = existenciaInicial - consumo;
    const merma = existenciaFinal % pbasPorVial[rvo];
    if (merma >= 0.5 * pbasPorVial[rvo]) {
      console.log(
        `Demasiada merma (${merma} pbas.) de ${rvo} para dar de baja automáticamente. Revisa si está correcto y dalo de baja manualmente.`
      );
      return;
    }
    consumos[rvo].canc += merma;
    console.log(
      `(${existenciaInicial} - ${consumo}) % ${pbasPorVial[rvo]} = ${merma}`
    );
  }
}

export function addCols(consumos, rvo) {
  consumos[rvo].cal = 0;
  consumos[rvo].canc = 0;
  consumos[rvo].motivo = "[Seleccione]";
}

export function calculate(consumos, iteratorOperations, specialOperations) {
  for (let rvo in consumos) {
    for (let operation of iteratorOperations) {
      operation(consumos, rvo);
    }
  }
  for (let operation in specialOperations) {
    const { func, params } = specialOperations[operation];
    func(consumos, params);
  }
  return consumos;
}

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

export function logInsufficientInventory(rvos) {
  for (let rvo in rvos) {
    console.log(
      `\nSolo hay ${rvos[rvo].inventory} pruebas de ${rvo} en inventario. No se pueden capturar los ${rvos[rvo].consumo} consumos.`
    );
  }
}
