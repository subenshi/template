const _ = require('./_');

module.exports = {

  getAll: async (req, res) => {
    const { pagination, query } = req;

    // Calls the getAll operation in the actual service
    const r = await _.services.getAll({ pagination, filter: query, options: { count: true, supportQFilter: true } })
    
    res.reply(r)
  },

  getOne: async (req, res) => {
    const { _id } = req.params;
    
    // Calls the getOne operation in the actual service
    const r = await _.services.getOne({ filter: { _id } });

    if (!r.data) {
      res.status(404).send();
      return;
    }
    res.reply(r)
  },

  create: async (req, res) => {
    const { body } = req;

    // Transform fields to mongodb ids
    if (body.myProperty) body.myProperty = _.id(body.myProperty);

    // Calls the create operation in the actual service
    const r = await _.services.create({ data: body }, req.nm);

    res.reply(r)
  },

  /**
   * Update a document by id
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  update: async (req, res) => {
    const { _id } = req.params;

    // Calls the getOne operation in the actual service.
    // this is used to ensure that the document exists
    // before updating it.
    const r = await _.services.getOne({ filter: { _id } });

    if (!r.data) {
      res.status(404).send();
      return;
    }

    const { body } = req;

    // Transform fields to mongodb ids
    if (body.myProperty) body.myProperty = _.id(body.myProperty);

    // Calls the update operation in the actual service
    await _.services.update({ filter: { _id }, data: body });

    // Call some other microservice
    await _.request(req.nm, 'other-service', 'method-name', { some: 'data' })

    res.reply({
      data: Object.assign(r.data, body)
    })
  },

  /**
   * Delete a document by id
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  delete: async (req, res) => {
    const { _id } = req.params;

    // Calls the getOne operation in the actual service.
    // this is used to ensure that the document exists
    // before deleting it.
    const r = await _.services.getOne({ filter: { _id } });

    if (!r.data) {
      res.status(404).send();
      return;
    }

    // Call some other microservice
    await _.request(req.nm, 'other-service', 'method-name', { some: 'data' })

    // Calls the delete operation in the actual service
    await _.services.delete({ filter: { _id } });

    res.reply({
      data: r.data
    })
  }

}