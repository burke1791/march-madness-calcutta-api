import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getUserUpcomingGames(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetUserUpcomingGames');

    const games = parseUserUpcomingGames(result.recordset);
    
    callback(null, games);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

// this only works when the games have two participants
// the participants can be unknown, but there can't be three possible participants
function parseUserUpcomingGames(games) {
  return games.map(game => {
    return {
      eventDate: new Date(game.EventDate),
      leagueId:  +game.LeagueId,
      leagueName: game.LeagueName,
      matchupId: +game.MatchupId,
      matchupDescription: game.MatchupDescription,
      tournamentId: +game.TournamentId,
      tournamentName: game.TournamentName,
      teams: parseMatchupTeams(game)
    }
  });
}

function parseMatchupTeams(game) {
  const team1 = {
    teamId: game.Team1Id,
    name: game.Team1Name,
    displayName: game.Team1DisplayName,
    isAlive: game.Team1IsAlive,
    logoUrl: game.Team1LogoUrl,
    ownerAlias: game.Team1Owner,
    ownerId: game.Team1OwnerId,
    payout: game.Team1Payout,
    price: game.Team1Price,
    score: game.Team1Score,
    seed: game.Team1Seed,
    seedGroupId: game.Team1SeedGroupId,
    seedGroupName: game.Team1SeedGroupName
  };

  const team2 = {
    teamId: game.Team2Id,
    name: game.Team2Name,
    displayName: game.Team2DisplayName,
    isAlive: game.Team2IsAlive,
    logoUrl: game.Team2LogoUrl,
    ownerAlias: game.Team2Owner,
    ownerId: game.Team2OwnerId,
    payout: game.Team2Payout,
    price: game.Team2Price,
    score: game.Team2Score,
    seed: game.Team2Seed,
    seedGroupId: game.Team2SeedGroupId,
    seedGroupName: game.Team2SeedGroupName
  };

  return [team1, team2];
}