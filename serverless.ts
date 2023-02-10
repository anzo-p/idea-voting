import type { AWS } from "@serverless/typescript";

import functions from "./serverless/functions";
import DynamoResources from "./serverless/dynamodb";

const serverlessConfiguration: AWS = {
  service: "service-5-idea-voting",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    region: "eu-west-1",
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: "dynamodb:*",
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.singleTable}",
          "arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.singleTable}/index/index1",
        ],
      },
    ],
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      singleTable: "${self:custom.tables.singleTable}",
    },
  },
  functions,
  resources: {
    Resources: {
      ...DynamoResources,
    },
    Outputs: {
      DynamoTableName: {
        Value: "${self:custom.tables.singleTable}",
        Export: {
          Name: "DynamoTableName",
        },
      },
    },
  },
  custom: {
    tables: {
      singleTable: "${sls:stage}-${self:service}-single-table",
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node16",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
