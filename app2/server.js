const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const PROTO_PATH = './shared.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const grpcDemo = grpc.loadPackageDefinition(packageDefinition).grpcdemo;

const ddb = new DynamoDB({ 
  region: process.env.CDK_DEFAULT_REGION
});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

async function storeUser(call, callback) {
  try {
    const { name, email, country } = call.request;

    const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Item: { name, email, country },
    };

    await ddbDocClient.send(new PutCommand(params));
    callback(null, { status: 'SUCCESS', message: 'User stored successfully!' });
  } catch(err) {
    console.error('Error storing data:', err);
    return callback(null, { status: 'FAILURE', message: err.message });
  }  
}

async function getAllUsers(call, callback) {
  try {
    const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
    };

    const data = await ddbDocClient.send(new ScanCommand(params));
    callback(null, {
      status: 'SUCCESS',
      users: data.Items || [],
    });
  } catch(err) {
    console.error('Error fetching all users:', err);
    return callback(null, { status: 'FAILURE', message: err.message });
  }
}

const server = new grpc.Server();
server.addService(grpcDemo.Greeter.service, { StoreUser: storeUser, GetAllUsers: getAllUsers });

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
  console.log('App2 gRPC server running on port 50052');
  server.start();
});
