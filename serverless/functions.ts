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

  getBoard: {
    handler: "src/functions/getBoard/index.handler",
    events: [
      {
        http: {
          method: "GET",
          path: "/boards/{boardId}",
        },
      },
    ],
  },

  createIdea: {
    handler: "src/functions/createIdea/index.handler",
    events: [
      {
        http: {
          method: "POST",
          path: "/ideas",
        },
      },
    ],
  },
};

export default functions;
