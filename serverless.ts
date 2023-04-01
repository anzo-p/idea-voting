import type { AWS } from "@serverless/typescript";

import functions from "./serverless/functions";
import CognitoResources from "./serverless/cognito";
import DynamoResources from "./serverless/dynamodb";

const serverlessConfiguration: AWS = {
  custom: {
    esbuild: {
      bundle: true,
      concurrency: 10,
      define: { "require.resolve": undefined },
      exclude: ["aws-sdk"],
      minify: false,
      platform: "node",
      sourcemap: true,
      target: "node16",
    },
    tables: {
      ideaVotingTable: "${sls:stage}-${self:service}-table",
    },
  },
  frameworkVersion: "3",
  functions,
  plugins: ["serverless-esbuild"],
  provider: {
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      IDEA_VOTING_TABLE: "${self:custom.tables.ideaVotingTable}",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: "dynamodb:*",
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.ideaVotingTable}",
          "arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.ideaVotingTable}/index/gsi1",
        ],
      },
    ],
    name: "aws",
    region: "eu-west-1",
    runtime: "nodejs16.x",
  },
  resources: {
    Outputs: {
      CognitoUserPoolId: {
        Value: {
          Ref: "CognitoUserPool",
        },
        Export: {
          Name: "${sls:stage}-${self:service}-user-pool-id",
        },
      },
      DynamoTableName: {
        Value: "${self:custom.tables.ideaVotingTable}",
        Export: {
          Name: "DynamoTableName",
        },
      },
    },
    Resources: {
      ...CognitoResources,
      ...DynamoResources,
    },
  },
  service: "service-5-idea-voting",
};

module.exports = serverlessConfiguration;
