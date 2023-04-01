import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuid } from "uuid";

import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { VoteRecord } from "src/types/dynamo";
import { getUserId } from "@libs/APIGateway";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.IDEA_VOTING_TABLE;

    const { ideaId } = event.pathParameters;

    if (!ideaId) {
      return formatJSONResponse({
        statusCode: 400,
        body: {
          message: "'ideaId' is required",
        },
      });
    }

    const userId = getUserId(event);

    const alreadyVoted = await Dynamo.query<VoteRecord>({
      tableName,
      index: "gsi1",
      pkKey: "pk",
      pkValue: `vote-${ideaId}`,
      skKey: "sk",
      skValue: userId,
    });

    if (alreadyVoted.length > 0) {
      return formatJSONResponse({
        statusCode: 400,
        body: {
          message: `user ${userId} has already voted`,
        },
      });
    }

    const data: VoteRecord = {
      id: uuid(),
      pk: `vote-${ideaId}`,
      sk: userId,
      userId,
      ideaId,
    };

    await Dynamo.write({ tableName, data });

    return formatJSONResponse({
      body: {
        message: `You have voted on this idea`,
        ideaId,
        voteId: data.id,
      },
    });
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      body: error.message,
    });
  }
};
