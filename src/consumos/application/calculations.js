

export function getTotals(consumos) {
  for (let rvo in consumos) {
    consumos[rvo].total = 0;
    for (let col in consumos[rvo]) {
      consumos[rvo].total += consumos[rvo][col];
    }
  }
  return consumos;
}