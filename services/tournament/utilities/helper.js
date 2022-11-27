
/**
 * @function parseTournamentTree
 * @param {Array<Object>} tree - the list of bracket nodes
 * @returns {Array<Object>}
 * @description reshapes the data into a format more easily used by the front end
 */
export function parseTournamentTree(tree) {
  return tree.map(game => {
    return {
      matchupId: game.MatchupId,
      matchupNum: game.MatchupNum,
      isPlayInGame: game.IsPlayInGame,
      roundNum: getRoundNum(game.MatchupId, tree, 1),
      parentMatchupIds: getParentMatchups(game, tree),
      childMatchupId: game.ChildMatchupId,
      teams: getTeams(game)
    }
  });
}

/**
 * @function getRoundNum
 * @param {Number} matchupId - unique identifier for the current matchup
 * @param {Array<Object>} tree - the entire tournament tree
 * @param {Number} round - the current round number
 * @returns {Number}
 * @description recursively searches the bracket tree to calculate a round number
 */
 function getRoundNum(matchupId, tree, round) {
  const game = tree.find(game => game.MatchupId == matchupId);
  
  if (game == undefined) {
    console.log('something is funky');
    return round;
  }

  const parentMatchup1Id = game.ParentMatchup1;
  const parentMatchup2Id = game.ParentMatchup2;
  const parentMatchup1Exists = !!tree.find(game => game.MatchupId == parentMatchup1Id)?.MatchupId;
  const parentMatchup2Exists = !!tree.find(game => game.MatchupId == parentMatchup2Id)?.MatchupId;  


  if (!parentMatchup1Exists && !parentMatchup2Exists) {
    // if neither parent matchups exist in the tree, then short-circuit
    return round;
  } else {
    // continue searching the tree through one of the parent matchups
    // this is flawed in that a non-symmetric bracket (e.g. Big Ten Tournament) will
    // yield incorrect roundNums
    const parentMatchupId = parentMatchup1Id || parentMatchup2Id;
    return getRoundNum(parentMatchupId, tree, round + 1)
  }
}

/**
 * @function getParentMatchups
 * @param {Object} game 
 * @param {Array<Object>} tree 
 * @returns {Array<Object>}
 * @description returns an array of parent matchup objects, containing the parent's matchupId and whether or not the parent is a play-in game
 */
function getParentMatchups(game, tree) {
  let parentMatchups = []

  if (game.ParentMatchup1 == null && game.ParentMatchup2 == null) return null;

  if (game.ParentMatchup1 !== null) {
    parentMatchups.push({
      parentMatchupId: game.ParentMatchup1,
      isPlayInGame: !!tree.find(node => node.MatchupId === game.ParentMatchup1)?.IsPlayInGame
    });
  }

  if (game.ParentMatchup2 !== null) {
    parentMatchups.push({
      parentMatchupId: game.ParentMatchup2,
      isPlayInGame: !!tree.find(node => node.MatchupId === game.ParentMatchup2)?.IsPlayInGame
    });
  }

  return parentMatchups;
}

/**
 * @function getTeams
 * @param {Object} game 
 * @returns {Array<Object>}
 * @description returns an array of the teams participating in a given game
 */
function getTeams(game) {
  return [
    {
      teamId: game.Team1Id,
      logoUrl: game.Team1LogoUrl,
      eliminated: !game.Team1IsAlive,
      seed: game.Team1Seed,
      teamName: game.Team1Name,
      displayName: game.Team1DisplayName,
      score: game.Team1Score,
      owner: game.Team1Owner,
      userId: game.Team1OwnerId,
      price: game.Team1Price,
      payout: game.Team1Payout,
      groupId: game.Team1SeedGroupId,
      groupName: game.Team1SeedGroupName
    },
    {
      teamId: game.Team2Id,
      logoUrl: game.Team2LogoUrl,
      eliminated: !game.Team2IsAlive,
      seed: game.Team2Seed,
      teamName: game.Team2Name,
      displayName: game.Team2DisplayName,
      score: game.Team2Score,
      owner: game.Team2Owner,
      userId: game.Team2OwnerId,
      price: game.Team2Price,
      payout: game.Team2Payout,
      groupId: game.Team2SeedGroupId,
      groupName: game.Team2SeedGroupName
    }
  ]
}