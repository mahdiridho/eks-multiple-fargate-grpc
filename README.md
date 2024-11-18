# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# Preparation
You must create one IAM user account with full admin access or with specific permissions if You are advanced. Then setup the env secrets for Github actions CI/CD including:
- AWS_IAM_USER
- AWS_ACCOUNT_ID
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

# Verify
First of all check and update the kubernetes config

```
aws eks update-kubeconfig --name <CREATE_CLUSTER_NAME> --region <AWS_REGION> --profile <AWS_CREDENTIAL_PROFILE>
```

Check the nodes

```
kubectl get nodes
```

Find out the Load Balancer's Public Address

```
kubectl get pods
kubectl get svc
```

Check Deployments and Services

```
kubectl get deployments -n app1
kubectl get deployments -n app2
kubectl get services -n app1
kubectl get services -n app2
```

Inspect Pod Logs

```
kubectl logs <pod-name> -n app1
kubectl logs <pod-name> -n app2
```