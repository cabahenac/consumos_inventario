

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