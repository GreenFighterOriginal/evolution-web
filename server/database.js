const {MongoClient} = require('mongodb');

const result = {};

function createInMemory() {
  const collections = {
    users: []
    , games: []
  };

  const match = (item, query) => {
    if (!query || Object.keys(query).length === 0) return true;
    return Object.keys(query).every((key) => {
      const q = query[key];
      if (q && typeof q === 'object' && q.$gte !== undefined) {
        return item[key] >= q.$gte && item[key] <= q.$lte;
      }
      return item[key] == q;
    });
  };

  const makeCollection = (name) => ({
    findOne: (query) => Promise.resolve(collections[name].find(item => match(item, query)) || null),
    insertOne: (doc) => {
      const _id = (Date.now().toString(36) + Math.random().toString(36).slice(2));
      const newDoc = Object.assign({_id}, doc);
      collections[name].push(newDoc);
      return Promise.resolve({insertedId: _id, ops: [newDoc]});
    },
    updateOne: (filter, update) => {
      const item = collections[name].find(i => match(i, filter));
      if (item) {
        if (update && update.$set) Object.assign(item, update.$set);
      }
      return Promise.resolve({result: {n: item ? 1 : 0}});
    },
    find: (query) => {
      const results = collections[name].filter(item => match(item, query));
      return {
        project: () => ({ toArray: () => Promise.resolve(results.map(r => r)) })
      };
    }
  });

  return { collection: (name) => makeCollection(name) };
}

if (process.env.MONGO_URL) {
  result.ready = MongoClient.connect(
    process.env.MONGO_URL
    , {useNewUrlParser: true}
  )
    .then(client => {
      result.db = client.db();
    })
    .catch((err) => {
      console.error('MongoDB connect error, falling back to in-memory DB', err);
      result.db = createInMemory();
    });
} else {
  // No Mongo configured — use lightweight in-memory DB for local/dev play
  result.ready = Promise.resolve().then(() => {
    result.db = createInMemory();
  });
}

export default result;

