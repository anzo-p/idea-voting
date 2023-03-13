import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuid } from "uuid";

import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { CreateIdeaBody } from "src/types/apiTypes";
import { IdeaRecord } from "src/types/dynamo";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const body = JSON.parse(event.body!);

    const validationError = validate(body);

    if (validationError) {
      return validationError;
    }

    const { title, description, boardId } = body as CreateIdeaBody;

    const data: IdeaRecord = {
      id: uuid(),
      pk: `idea-${boardId}`,
      sk: Date.now().toString(),
      boardId,
      title,
      description: description || "",
      date: Date.now(),
    };

    await Dynamo.write({ tableName, data });

    return formatJSONResponse({
      statusCode: 201,
      body: {
        message: "Idea created",
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
  const { title, boardId } = body;

  if (!title || !boardId) {
    return formatJSONResponse({
      statusCode: 400,
      body: {
        message: "'title' and 'boardId' are required'",
      },
    });
  }

  return;
};
