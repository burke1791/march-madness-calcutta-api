
const constructAuctionPayload = (data) => {
  let isError = Object.keys(data)[0] === 'Error';

  let payload = {
    msgObj: data
  };

  if (isError) {
    payload.msgType = 'error';
  } else {
    payload.msgType = 'auction';
  }

  return payload;
}

export {
  constructAuctionPayload
};