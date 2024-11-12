const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');

// gRPC setup
const PROTO_PATH = './shared.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const grpcDemo = grpc.loadPackageDefinition(packageDefinition).grpcdemo;

const client = new grpcDemo.Greeter('app2.app2.svc.cluster.local:50052', grpc.credentials.createInsecure());

// Express server setup
const app = express();
const PORT = 50051;

app.get('/', (req, res) => {
  client.SayHello({ name: 'from App1' }, (err, response) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error communicating with App2');
    } else {
      res.send(`Message from App2: ${response.message}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`App1 HTTP server running on port ${PORT}`);
});
