import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuid } from "uuid";

import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { CreateBoardBody } from "src/types/apiTypes";
import { BoardRecord } from "src/types/dynamo";
import { getUserId } from "@libs/APIGateway";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const body = JSON.parse(event.body!);

    const validationError = validate(body);

    if (validationError) {
      return validationError;
    }

    const { name, description = "", isPublic = false } = body as CreateBoardBody;

    const now = Date.now();

    const data: BoardRecord = {
      id: uuid(),
      pk: "board",
      sk: now.toString(),
      ownerId: getUserId(event),
      boardName: name,
      description,
      isPublic,
      date: now,
    };

    await Dynamo.write({ tableName, data });

    return formatJSONResponse({
      statusCode: 201,
      body: {
        message: "board created",
        id: data.id,
      },
    });
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      body: error.message,
    });
  }
};

const validate = (body: Record<string, any>) => {
  if (!body.name) {
    return formatJSONResponse({
      statusCode: 400,
      body: {
        message: "'name' is required'",
      },
    });
  }

  return;
};
