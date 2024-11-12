import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as lambdaLayerKubectl from '@aws-cdk/lambda-layer-kubectl-v31';
import { Construct } from 'constructs';

export class MyFargateAppEksMultipleGrpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create a VPC
    const vpc = new ec2.Vpc(this, 'MyVpcMultipleGrpc', { maxAzs: 2 });

    // Step 2: Create an EKS Cluster
    const cluster = new eks.Cluster(this, 'MyClusterMultipleGrpc', {
      vpc,
      version: eks.KubernetesVersion.V1_31,
      defaultCapacity: 2,  // Number of worker nodes
      kubectlLayer: new lambdaLayerKubectl.KubectlV31Layer(this, 'KubectlLayer')
    });

    // Use the existing IAM user
    const existingUser = iam.User.fromUserName(this, 'ExistingUser', 'xcd');

    // Map the IAM user to the cluster
    cluster.awsAuth.addUserMapping(existingUser, {
      groups: ['system:masters'],
    });

    // Step 3: Add a Fargate Profile
    cluster.addFargateProfile('DefaultFargateProfile', {
      selectors: [{ namespace: 'default' }]
    });

    // === App 1 ===
    this.addFargateApp(cluster, 'App1', './app1', 50051, true);

    // === App 2 ===
    this.addFargateApp(cluster, 'App2', './app2', 50052, false);
  }

  private addFargateApp(cluster: eks.Cluster, appName: string, appDir: string, port: number, isPublic: boolean = false) {
    // Create a Namespace for the App
    const namespace = cluster.addManifest(`${appName}Namespace`, {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: appName.toLowerCase() },
    });

    // Add a Fargate Profile for the Namespace
    cluster.addFargateProfile(`${appName}FargateProfile`, {
      selectors: [{ namespace: appName.toLowerCase() }],
    });

    // Build the Docker Image
    const dockerImage = new ecr_assets.DockerImageAsset(this, `${appName}DockerImage`, {
      directory: appDir,
      platform: ecr_assets.Platform.LINUX_AMD64,
    });

    // Create the Deployment
    const deployment = cluster.addManifest(`${appName}Deployment`, {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: appName.toLowerCase(), namespace: appName.toLowerCase() },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: appName.toLowerCase() } },
        template: {
          metadata: { labels: { app: appName.toLowerCase() } },
          spec: {
            containers: [
              {
                name: appName.toLowerCase(),
                image: dockerImage.imageUri,
                ports: [{ containerPort: port }],
              },
            ],
          },
        },
      },
    });

    // Ensure Deployment Depends on Namespace
    deployment.node.addDependency(namespace);

    // Create the Service
    const serviceType = isPublic ? 'LoadBalancer' : 'ClusterIP';
    const externalPort = isPublic ? 80 : port;
    const service = cluster.addManifest(`${appName}Service`, {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: appName.toLowerCase(), namespace: appName.toLowerCase() },
      spec: {
        type: serviceType,
        ports: [{ port: externalPort, targetPort: port }],
        selector: { app: appName.toLowerCase() },
      },
    });

    // Ensure Service Depends on Deployment
    service.node.addDependency(deployment);
  }
}
