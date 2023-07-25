const _ = require('./_');

module.exports.getAll = async (args, nm) => {
  const { pagination, projection, filter, options } = args
  const { count } = options || {}

  let response = {
    data: [],
    XTotalCount: 0,
  }

  // Do your filter transformations here
  // if (filter.contactId) filter.contactId = _.id(filter.contactId);
  // if (filter.positionId) filter.positionId = _.id(filter.positionId);

  const dbFilter = filter || {}

  // We're requesting the total count of documents based on the filter
  if (count) {
    response.XTotalCount = await _.db().countDocuments(dbFilter);
  }

  // Get the actual data based on the filter
  const cursor = _.db().find(args.filter).project(args.projection || {});

  if (pagination) {
    cursor.sort({ [pagination.sort]: pagination.order });
    cursor.skip(pagination.skip);
    cursor.limit(pagination.limit);
  }

  response.data = await cursor.toArray();
  response.data = response.data.map(this.transform);

  return response;
};

module.exports.getOne = async (args, nm) => {
  const { filter, projection } = args;

  const response = {};

  if (!filter._id) {
    throw new Error('Missing _id');
  }

  // Do your filter transformations here
  filter._id = _.id(filter._id);

  response.data = await _.db().findOne(filter, projection);
  if (!response.data) return response;
  response.data = this.transform(response.data);

  return response;
}

module.exports.update = async (args, nm) => {
  const { filter, data } = args;

  if (!filter._id) {
    throw new Error('Missing _id');
  }

  // Add/Update default fields
  data.updatedAt = new Date();

  // Do your filter transformations here
  filter._id = _.id(filter._id);

  const response = await _.db().updateOne(filter, { $set: data });

  return response;
}

module.exports.create = async (args, nm) => {
  const response = {};
  const { data } = args;

  // Add default fields
  data.createdAt = new Date();
  data.updatedAt = new Date();

  // Perform database operation
  const creation = await _.db().insertOne(data);

  if (creation && creation.insertedId) {
    response.data = Object.assign(data, { _id: creation.insertedId });

    // Call some other microservice
    await _.request(req.nm, 'other-service', 'method-name', { some: 'data' })
  }

  return response;
}

module.exports.delete = async (args, nm) => {
  const { filter } = args;

  if (!filter._id) {
    throw new Error('Missing _id');
  }

  // Do your filter transformations here
  filter._id = _.id(filter._id);

  // Perform database operation
  const response = await _.db().deleteOne(filter);

  return response;
}
