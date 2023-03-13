import { mockSend, emptyResult } from "src/__mock__/mockDynamoDBClient";

import { QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";

import { handler } from ".";

const userId = uuid();
const ideaId = uuid();

const expectedVoteFetch: Record<string, any>[] = [uuid()].map((voteId) => {
  return {
    id: voteId,
    pk: `vote-${ideaId}`,
    sk: userId,
    userId,
    ideaId,
  };
});

// @ts-ignore
const queryVotesResult: QueryCommandOutput = {
  Items: expectedVoteFetch,
};

// @ts-ignore
const baseEvent: APIGatewayProxyEvent = {
  pathParameters: {
    ideaId,
  },
};

describe("voteOnIdea", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("200 success", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      ...baseEvent,
      requestContext: {
        authorizer: {
          claims: {
            sub: userId,
          },
        },
      },
    };

    mockSend.mockReturnValueOnce(emptyResult).mockReturnValueOnce(queryVotesResult);

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);
    const queryVotesCommand = mockSend.mock.calls[0][0].input;
    const putVoteCommand = mockSend.mock.calls[1][0].input;

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(
      JSON.stringify({
        message: "You have voted on this idea",
        ideaId,
        voteId: responseBody.voteId,
      })
    );

    expect(mockSend).toBeCalledTimes(2);

    expect(queryVotesCommand.TableName).toBe("test-single-table");
    expect(queryVotesCommand.KeyConditionExpression).toBe("pk = :pkvalue AND sk = :skkeyvalue");
    expect(queryVotesCommand.ExpressionAttributeValues).toStrictEqual({
      ":pkvalue": `vote-${ideaId}`,
      ":skkeyvalue": userId,
    });

    expect(putVoteCommand.TableName).toBe("test-single-table");
    expect(putVoteCommand.Item.id).toBe(responseBody.voteId);
    expect(putVoteCommand.Item.pk).toBe(`vote-${ideaId}`);
    expect(putVoteCommand.Item.sk).toBe(userId);
    expect(putVoteCommand.Item.userId).toBe(userId);
    expect(putVoteCommand.Item.ideaId).toBe(ideaId);
  });

  test("already voted", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      ...baseEvent,
      requestContext: {
        authorizer: {
          claims: {
            sub: userId,
          },
        },
      },
    };

    mockSend.mockReturnValueOnce(queryVotesResult);

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual(
      JSON.stringify({
        message: `user ${userId} has already voted`,
      })
    );
  });

  test("no ideaId", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      pathParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual(
      JSON.stringify({
        message: "'ideaId' is required",
      })
    );
  });
});
