import { connection } from '../db';

const orm = {
  queryBuilder: async function(params, values) {
    let queryString = '';

    // Begin with the initial operation type
    if (params.type.toLowerCase() === 'select') {
      queryString += 'Select ';
    } else if (params.type.toLowerCase() === 'insert') {
      queryString += 'Insert ';
    } else if (params.type.toLowerCase() === 'update') {
      queryString += 'Update ';
    }

    

    return queryString;
  }
}

export default orm;