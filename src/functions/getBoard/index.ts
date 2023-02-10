import { APIGatewayProxyEvent } from "aws-lambda";

import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { BoardRecord, IdeaRecord } from "src/types/dynamo";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const boardId = event.pathParameters?.boardId;

    if (!boardId) {
      return formatJSONResponse({
        statusCode: 400,
        body: {
          message: "path variable 'boardId' is required'",
        },
      });
    }

    const boardData = await Dynamo.get<BoardRecord>({
      tableName,
      pkValue: boardId,
    });

    if (!boardData) {
      return formatJSONResponse({
        body: {},
      });
    } else {
      const { pk, sk, ...board } = boardData;

      const ideasData = await Dynamo.query<IdeaRecord>({
        tableName,
        index: "index1",
        pkValue: `idea-${boardId}`,
        pkKey: "pk",
      });

      const ideas = ideasData.map(async ({ pk, sk, boardId, ...idea }) => {
        const votes = await Dynamo.query<IdeaRecord>({
          tableName,
          index: "index1",
          pkKey: "pk",
          pkValue: `vote-${idea.id}`,
        });

        return {
          ...idea,
          votes: votes.length,
        };
      });

      const response = (await Promise.all(ideas)).sort((a, b) => b.votes - a.votes);

      return formatJSONResponse({
        body: {
          ...board,
          ideas: response,
        },
      });
    }
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      body: error.message,
    });
  }
};
