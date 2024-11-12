const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// gRPC setup
const PROTO_PATH = './shared.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcDemo = grpc.loadPackageDefinition(packageDefinition).grpcdemo;

// Implement gRPC service
function sayHello(call, callback) {
  console.log(`Received: ${call.request.name}`);
  callback(null, { message: `Hello, ${call.request.name} from App2!` });
}

const server = new grpc.Server();
server.addService(grpcDemo.Greeter.service, { SayHello: sayHello });

const PORT = 50052;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`App2 gRPC server running on port ${PORT}`);
  server.start();
});
