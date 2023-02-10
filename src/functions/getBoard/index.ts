import { APIGatewayProxyEvent } from "aws-lambda";

import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { BoardRecord } from "src/types/dynamo";

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

    const data = await Dynamo.get<BoardRecord>({
      tableName,
      pkValue: boardId,
    });

    if (!data) {
      return formatJSONResponse({
        body: {},
      });
    } else {
      const { pk, sk, ...board } = data;

      return formatJSONResponse({
        body: board,
      });
    }
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      body: error.message,
    });
  }
};
