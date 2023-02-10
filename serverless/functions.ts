import { AWS } from "@serverless/typescript";

interface Authorizer {
  name: string;
  type: string;
  arn: {
    "Fn::GetAtt": string[];
  };
}

const functions: AWS["functions"] = {
  createBoard: {
    handler: "src/functions/createBoard/index.handler",
    events: [
      {
        http: {
          method: "get",
          path: "/boards",
        },
      },
    ],
  },
};

export default functions;
