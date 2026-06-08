import {ObjectId} from 'mongodb';
import database from '../database';

// database may be an in-memory fallback; keep calls compatible

export const db$findUser = (authType, authId) => {
  return database.db.collection('users').findOne({'auth.type': authType, 'auth.id': authId});
};

export const db$registerUser = (user) => {
  return database.db.collection('users').insertOne(user);
};

export const db$updateUserName = (id, name) => {
  let filter;
  try {
    filter = {'_id': ObjectId(id)};
  } catch (err) {
    filter = {'_id': id};
  }
  return database.db.collection('users').updateOne(filter, {$set: {name}});
};

export const db$updateUserByAuth = (authType, authId, updateObject) => {
  return database.db.collection('users').updateOne({'auth.type': authType, 'auth.id': authId}, {
    $set: {
      auth: updateObject.auth
    }
  });
};

export const db$gameEnd = (dbGame) => {
  if (process.env.NODE_ENV !== 'test' && process.env.WRITE_STATS)
    return database.db.collection('games').insertOne(dbGame);
};

export const db$findStats = (from, to) => {
  return database.db.collection('games')
    .find({timeEnd: {$gte: from, $lte: to}})
    .project({'_id': 0})
    .toArray();
};
