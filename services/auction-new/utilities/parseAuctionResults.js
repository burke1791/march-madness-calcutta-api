
export function parseAuctionResults(data) {
  const slots = data?.AuctionSlots != null ? data.AuctionSlots.L : [];
  const results = data?.AuctionResults != null ? data.AuctionResults.L : [];

  return {
    leagueId: +data.LeagueId.N,
    slots: parseSlots(slots, results)
  };
}

function parseSlots(slots, results) {
  return slots.map(s => {
    const res = results.find(r => +r.M.itemId.N == +s.M.itemId.N && +r.M.itemTypeId.N && +s.M.itemTypeId.N);

    return {
      itemId: +s.M.itemId.N,
      itemName: s.M.itemName.S,
      seed: s.M.seed?.NULL ? null : +s.M.seed.N,
      displayName: s.M.displayName.S,
      itemTypeName: s.M.itemTypeName.S,
      itemTypeId: +s.M.itemTypeId.N,
      teamLogoUrl: s.M.teamLogoUrl?.NULL ? null : s.M.teamLogoUrl.S,
      isComplete: s.M.isComplete.BOOL,
      userId: res != null ? +res.M.userId.N : null,
      alias: res != null ? res.M.alias.S : null,
      price: res != null ? +res.M.price.N : null
    }
  });
}