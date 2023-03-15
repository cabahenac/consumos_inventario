import { consumosPerCal } from "../domain/cals.js";


export function getTotal(consumos, rvo) {
  consumos[rvo].total = 0;
  for (let col of ['res', 'rep', 'qc', 'man']) {
    consumos[rvo].total += consumos[rvo][col];
  }
}


export function getPx(consumos, rvo) {
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
        motivo: '[Seleccione]',
      }
    }
    consumos[rvo].cal += consumosPerCal[rvo];
  }
}


export function getExceptions(consumos, exceptions) {
  for (let rvo in exceptions) {
    for (let exception in exceptions[rvo]) {
      console.log(exception);
      consumos[rvo][exception] += exceptions[rvo][exception];
    }
  }
}


export function addCols(consumos, rvo) {
  consumos[rvo].cal = 0;
  consumos[rvo].canc = 0;
  consumos[rvo].motivo = '[Seleccione]';
}


export function calculate(consumos, iteratorOperations, specialOperations) {
  for (let rvo in consumos) {
    for (let operation of iteratorOperations) {
      operation(consumos, rvo);
    }
  }
  for (let operation in specialOperations) {
    const { func, params } = specialOperations[operation]
    func(consumos, params);
  }
  return consumos
}
