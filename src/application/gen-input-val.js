const colNames = {
  $txtControlCapMGrd: 'qc',
  $txtCalibracionCapMGrd: 'cal',
  $txtPacientes: 'px',
  $txtRepeticiones: 'rep',
  $txtCancelacionCapMGrd: 'canc',
  $cmbMotCancelacionGrd: 'motivo',
  $hfIDProducto: 'id',
};     


export function generateInputValues(consumos, rows, colNames) {
  const prefix = 'ctl00$ContentMasterPage$grdConsumo$ctl';
  const inputValues = {};
  for (let rvo in consumos) {
    for (let col in colNames) {
      inputValues[`${prefix}${rows[rvo]}${col}`] = consumos[rvo][colNames[col]];
    }
  }
  return inputValues;
}


export function generateZeroInputValues(consumos, rows, colNames) {
  const prefix = 'ctl00$ContentMasterPage$grdConsumo$ctl';
  const inputValues = {};
  for (let rvo in consumos) {
    for (let col in colNames) {
      inputValues[`${prefix}${rows[rvo]}${col}`] = 
        col === '$cmbMotCancelacionGrd' ? '' : 0;
    }
  }
  return inputValues;
}


export { colNames };