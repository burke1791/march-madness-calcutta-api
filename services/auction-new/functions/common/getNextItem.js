import { getAuctionSettings } from './auctionSettings';
import { getAuctionSales } from './auctionResults';

/**
 * @typedef AuctionSlot
 * @property {Number} itemId
 * @property {String} itemName
 * @property {Number} [seed]
 * @property {String} displayName
 * @property {String} itemTypeName
 * @property {Number} itemTypeId
 * @property {String} [teamLogoUrl]
 */

/**
 * @function
 * @param {Number} leagueId 
 * @param {Boolean} isRandom 
 * @returns {AuctionSlot}
 */
export async function getNextItemRandom(leagueId) {
  const slots = await findUnsoldSlots(leagueId);

  const randomItem = slots[Math.floor(Math.random() * slots.length)];
  console.log(randomItem);

  return randomItem;
}

export async function getNextItemSpecific(leagueId, itemId, itemTypeId) {
  const slots = await findUnsoldSlots(leagueId);

  const item = slots.find(s => s.itemId === +itemId && s.itemTypeId === +itemTypeId);

  if (item == undefined) {
    console.log(slots);
    console.log(itemId, itemTypeId);
    throw new Error('Invalid item');
  }

  return item;
}

async function findUnsoldSlots(leagueId) {
  const { slots } = await getAuctionSettings(leagueId, 'LeagueId, AuctionSlots');
  const sales = await getAuctionSales(leagueId);

  const unsold = slots.filter(s => {
    const sale = sales.find(sl => sl.itemId === s.itemId && sl.itemTypeId === s.itemTypeId);

    if (sale == undefined) {
      return true;
    }

    return false;
  });

  console.log(unsold);
  return unsold;
}