const _ = require('./_');

// Connect to the different servers this microservice depends on, like NATS,
// MongoDB, etc. depending on the availability of its environment variables
_.connect(() => {
  // Receive a message via NATS from the gateway or another microservice
  _.receive(async (m, originalMessage) => {
    const { operation } = originalMessage;

    // If the microservice is invoked by the gateway, then the message
    // must be routed to the router.js file methods.
    if (originalMessage.application.from === 'gateway') {
      const { routerId } = originalMessage.original;
      _.router(routerId, m, originalMessage)
      return;
    }
  
    // The microservice is invoked by another microservice, so the message
    // must be routed to the services.js file methods.
    const op = _.services[operation]
    
    // Fail if the method is not found
    if (!op) {
      return _.replyError(m, { error: `Operation ${operation} not found` })
    };
  
    // Execute the operation
    try {
      const r = await op(originalMessage.payload)
      _.reply(m, r)
    }
    catch (err) {
      _.replyError(m, err)
    }
  })
});