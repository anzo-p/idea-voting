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

  listBoards: {
    handler: "src/functions/listBoards/index.handler",
    events: [
      {
        http: {
          method: "GET",
          path: "/boards",
        },
      },
    ],
  },
};

export default functions;
