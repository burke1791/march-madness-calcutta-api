
export function parseAuctionResults(data) {
  const slots = data?.AuctionSlots != null ? data.AuctionSlots.L : [];
  const results = data?.AuctionResults != null ? data.AuctionResults.L : [];

  return {
    leagueId: +data.LeagueId.N,
    slots: parseSlots(slots),
    results: parseResults(results)
  };
}

function parseSlots(slots) {
  return slots.map(s => {
    return {
      itemId: +s.M.itemId.N,
      itemName: s.M.itemName.S,
      seed: s.M.seed?.NULL ? null : +s.M.seed.N,
      displayName: s.M.displayName.S,
      itemTypeName: s.M.itemTypeName.S,
      itemTypeId: +s.M.itemTypeId.N,
      teamLogoUrl: s.M.teamLogoUrl?.NULL ? null : s.M.teamLogoUrl.S,
      isComplete: s.M.isComplete.BOOL
    }
  });
}

function parseResults(results) {
  console.log(results);
  return [];
}