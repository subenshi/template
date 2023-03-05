const _ = require('./_');

// Connect to the different servers this microservice depends on, like NATS,
// MongoDB, etc. depending on the availability of its environment variables
_.connect(() => {
  // Receive a message via NATS from the gateway or another microservice
  _.receive(async (m, message) => {
    const { url, method, query, body, headers, user } = message.payload

    _.db()
      .insertOne({
        text: `Request processed`
      })
      .then(insert => {
        const response = {
          code: 200,
          data: { hello_world: `${query.name} ${insert.insertedId}`, url, method, query, body, headers, user },
        }

        // Sends the response to the gateway or another microservice
        _.reply(m, response)
      })
      .catch(e => {
        console.error(e);
      })
  })
  
  // Runs a command in the database:
  // _.db().insertMany([{a:1},{b:2}]);

  // Send a message to another microservice, without expecting a response
  // _.send( {a:'Hello World!'} )

  // Send a message to another microservice, and expect a response (promise)
  // _.request(message.service, message, { timeout: 5000 })
});