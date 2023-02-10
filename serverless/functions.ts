import { AWS } from "@serverless/typescript";

import { Authorizer } from "src/types/authorizer";

export const authorizer: Authorizer = {
  name: "authorizer",
  type: "COGNITO_USER_POOLS",
  arn: { "Fn::GetAtt": ["CognitoUserPool", "Arn"] },
};

const functions: AWS["functions"] = {
  createBoard: {
    handler: "src/functions/createBoard/index.handler",
    events: [
      {
        http: {
          method: "POST",
          path: "/boards",
          authorizer,
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
          authorizer,
        },
      },
    ],
  },

  voteOnIdea: {
    handler: "src/functions/voteOnIdea/index.handler",
    events: [
      {
        http: {
          method: "POST",
          path: "/ideas/{ideaId}",
          authorizer,
        },
      },
    ],
  },
};

export default functions;
