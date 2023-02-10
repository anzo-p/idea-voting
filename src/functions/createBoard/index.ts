import { APIGatewayProxyEvent } from "aws-lambda";
import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body!);

    const tableName = process.env.singleTable;

    const validationError = validate(body);

    return formatJSONResponse({ body: { message: "flight successfully booked" } });
  } catch (error) {
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};

const validate = (body: Record<string, any>) => {
  if (!body.name) {
    return formatJSONResponse({
      body: {
        message: "'name' is required'",
      },
    });
  }
};
