import { mockSend } from "src/__mock__/mockDynamoDBClient";

import { GetCommandOutput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

import { BoardRecord } from "src/types/dynamo";

import { handler } from ".";

const boardId = uuid();

const ids = (n: number) => Array.from({ length: n }, () => uuid());

const expectedBoardFetch: BoardRecord = {
  id: boardId,
  pk: "board",
  sk: Date.now().toString(),
  ownerId: uuid(),
  boardName: `board number ${boardId}`,
  description: "a board of some despcription or another",
  isPublic: true,
  date: Date.now(),
};

const expectedIdeasFetch: Record<string, any>[] = ids(2).map((id) => {
  return {
    id,
    pk: `idea-${boardId}`,
    sk: Date.now().toString(),
    boardId,
    title: `Brilliant idea, number ${id}`,
    description: "maybe doable, hopefully",
    date: Date.now(),
  };
});

const voteRecord = (ideaId: string, userId: string = uuid()) => {
  return {
    id: uuid(),
    pk: `vote-${ideaId}`,
    sk: userId,
    userId,
    ideaId,
  };
};

const expectedVotesFetch = (ideaId: string, voteCount: number) => {
  return ids(voteCount).map(() => {
    return voteRecord(ideaId);
  });
};

describe("getBoard", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("200 success", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        boardId,
      },
    };

    // @ts-ignore
    const getBoardResult: GetCommandOutput = {
      Item: expectedBoardFetch,
    };

    // @ts-ignore
    const queryIdeasResult: QueryCommandOutput = {
      Items: expectedIdeasFetch,
    };

    // @ts-ignore
    const queryIdea1VotesResult: QueryCommandOutput = {
      Items: expectedVotesFetch(expectedIdeasFetch[0].id, 1),
    };

    // @ts-ignore
    const queryIdea2VotesResult: QueryCommandOutput = {
      Items: expectedVotesFetch(expectedIdeasFetch[1].id, 2),
    };

    mockSend
      .mockReturnValueOnce(getBoardResult)
      .mockReturnValueOnce(queryIdeasResult)
      .mockReturnValueOnce(queryIdea1VotesResult)
      .mockReturnValueOnce(queryIdea2VotesResult);

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);
    const queryBoard = mockSend.mock.calls[0][0].input;
    const queryIdeas = mockSend.mock.calls[1][0].input;
    const queryIdea1Votes = mockSend.mock.calls[2][0].input;
    const queryIdea2Votes = mockSend.mock.calls[3][0].input;

    expect(queryBoard.TableName).toEqual("test-single-table");
    expect(queryBoard.Key).toEqual({ id: boardId });

    expect(queryIdeas.TableName).toEqual("test-single-table");
    expect(queryIdeas.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdeas.ExpressionAttributeValues).toEqual({
      ":pkvalue": `idea-${boardId}`,
    });

    expect(queryIdea1Votes.TableName).toEqual("test-single-table");
    expect(queryIdea1Votes.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdea1Votes.ExpressionAttributeValues).toEqual({
      ":pkvalue": `vote-${expectedIdeasFetch[0].id}`,
    });

    expect(queryIdea2Votes.TableName).toEqual("test-single-table");
    expect(queryIdea2Votes.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdea2Votes.ExpressionAttributeValues).toEqual({
      ":pkvalue": `vote-${expectedIdeasFetch[1].id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(responseBody.id).toEqual(expectedBoardFetch.id);
    expect(responseBody.boardName).toEqual(expectedBoardFetch.boardName);
    expect(responseBody.description).toEqual(expectedBoardFetch.description);
    expect(responseBody.isPublic).toEqual(expectedBoardFetch.isPublic);
    expect(responseBody.ownerId).toEqual(expectedBoardFetch.ownerId);
    expect(responseBody.date).toEqual(expectedBoardFetch.date);

    const highestRankIdea = responseBody.ideas.sort((a: any, b: any) => b.votes - a.votes)[0];

    expect(responseBody.ideas.length).toEqual(expectedIdeasFetch.length);
    expect(responseBody.ideas[0].id).toEqual(highestRankIdea.id);
    expect(responseBody.ideas[0].title).toEqual(highestRankIdea.title);
    expect(responseBody.ideas[0].description).toEqual(highestRankIdea.description);
    expect(responseBody.ideas[0].date).toEqual(highestRankIdea.date);
    expect(responseBody.ideas[0].votes).toEqual(highestRankIdea.votes);
  });
});
