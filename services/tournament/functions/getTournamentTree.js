import { BigInt } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getTournamentTree(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetTournamentTree');

    console.log(result.recordsets);
    console.log(result.recordset[0]);

    let data;

    if (result.recordset[0]?.Error == 'No bracket available') {
      data = {
        errorMessage: 'No bracket available'
      };
    } else {
      data = {
        bracketMetadata: result.recordsets[0],
        bracket: parseTournamentTree(result.recordsets[1])
      };
    }

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR' });
  }
}

/**
 * @function parseTournamentTree
 * @param {Array<Object>} tree - the list of bracket nodes
 * @returns {Array<Object>}
 * @description reshapes the data into a format more easily used by the front end
 */
function parseTournamentTree(tree) {
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
 * @param {Number} matchup - unique identifier for the current matchup
 * @param {Array<Object>} tree - the entire tournament tree
 * @param {Number} round - the current round number
 * @returns {Number}
 * @description recursively searches the bracket tree to calculate a round number
 */
function getRoundNum(matchup, tree, round) {
  let parentMatchupId = tree.find(game => game.MatchupId == matchup).ParentMatchup1;
  
  if (parentMatchupId == undefined || parentMatchupId == null) {
    return round;
  } else {
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
      isPlayInGame: tree.find(node => node.MatchupId === game.ParentMatchup1).IsPlayInGame
    });
  }

  if (game.ParentMatchup2 !== null) {
    parentMatchups.push({
      parentMatchupId: game.ParentMatchup2,
      isPlayInGame: tree.find(node => node.MatchupId === game.ParentMatchup2).IsPlayInGame
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