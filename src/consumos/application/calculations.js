

export function getTotal(consumos, rvo) {
  consumos[rvo].total = 0;
  for (let col of ['res', 'rep', 'qc', 'man']) {
    consumos[rvo].total += consumos[rvo][col];
  }
}


export function getPx(consumos, rvo) {
  consumos[rvo].px = consumos[rvo].res - consumos[rvo].man;
}


export function calculate(consumos, operations) {
  for (let rvo in consumos) {
    for (let operation of operations) {
      operation(consumos, rvo);
    }
  }
  return consumos
}