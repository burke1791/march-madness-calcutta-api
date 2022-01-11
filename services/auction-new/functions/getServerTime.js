
export async function getServerTime(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const timestamp = new Date().valueOf();

  const result = [{ ServerTimestamp: timestamp }];

  callback(null, result);
}