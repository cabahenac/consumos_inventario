// (For all functions, $ stands for a cheerio HTML parser function)

export function getRows($) {
  const rows = {};
  $('.wd090').each((i, e) => {
    const rvo = $(e).text();
    const row = $(e).attr('id').slice(38, 40);
    rows[rvo] = row;
  });
  return rows;
}


export function getInventory($, rows) {
  let inventory = {};
  for (let row in rows) {
    inventory[row] = +$(`#ctl00_ContentMasterPage_grdConsumo_ctl${rows[row]}_lblExistFinal`).text();
  }

  return inventory;
}