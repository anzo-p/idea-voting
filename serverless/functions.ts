import { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  createBoard: {
    handler: "src/functions/createBoard/index.handler",
    events: [
      {
        http: {
          method: "POST",
          path: "/boards",
        },
      },
    ],
  },
};

export default functions;
