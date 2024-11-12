const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
const port = 50051;

const PROTO_PATH = './shared.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const grpcDemo = grpc.loadPackageDefinition(packageDefinition).grpcdemo;

const grpcClient = new grpcDemo.Greeter('app2.app2.svc.cluster.local:50052', grpc.credentials.createInsecure());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/users', (req, res) => {
  grpcClient.GetAllUsers({}, (err, response) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).send('Failed to fetch users.');
    }
    res.json(response.users);
  });
});

app.post('/submit', (req, res) => {
  const { name, email, country } = req.body;

  if (!name || !email || !country) {
    return res.status(400).send('All fields are required.');
  }

  grpcClient.StoreUser({ name, email, country }, (err, response) => {
    if (err) {
      console.error('Error storing user:', err);
      return res.status(500).send('Failed to store user.');
    }

    res.json({ message: response.message });
  });
});

app.listen(port, () => {
  console.log(`App1 server running on port ${port}`);
});
