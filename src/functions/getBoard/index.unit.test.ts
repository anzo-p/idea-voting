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

const expectedIdeasFetch: Record<string, any>[] = ids(2).map((ideaId) => {
  return {
    id: ideaId,
    pk: `idea-${boardId}`,
    sk: Date.now().toString(),
    boardId,
    title: `Brilliant idea, number ${ideaId}`,
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

// @ts-ignore
const queryResultEmpty: QueryCommandOutput = {
  Items: [],
};

describe("getBoard", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("200 success", async () => {
    mockSend
      .mockReturnValueOnce(getBoardResult)
      .mockReturnValueOnce(queryIdeasResult)
      .mockReturnValueOnce(queryIdea1VotesResult)
      .mockReturnValueOnce(queryIdea2VotesResult);

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);
    const queryBoardCommand = mockSend.mock.calls[0][0].input;
    const queryIdeasCommand = mockSend.mock.calls[1][0].input;
    const queryIdea1VotesCommand = mockSend.mock.calls[2][0].input;
    const queryIdea2VotesCommand = mockSend.mock.calls[3][0].input;

    expect(queryBoardCommand.TableName).toEqual("test-single-table");
    expect(queryBoardCommand.Key).toEqual({ id: boardId });

    expect(queryIdeasCommand.TableName).toEqual("test-single-table");
    expect(queryIdeasCommand.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdeasCommand.ExpressionAttributeValues).toEqual({
      ":pkvalue": `idea-${boardId}`,
    });

    expect(queryIdea1VotesCommand.TableName).toEqual("test-single-table");
    expect(queryIdea1VotesCommand.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdea1VotesCommand.ExpressionAttributeValues).toEqual({
      ":pkvalue": `vote-${expectedIdeasFetch[0].id}`,
    });

    expect(queryIdea2VotesCommand.TableName).toEqual("test-single-table");
    expect(queryIdea2VotesCommand.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryIdea2VotesCommand.ExpressionAttributeValues).toEqual({
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

  test("200 - ideas have no votes", async () => {
    mockSend
      .mockReturnValueOnce(getBoardResult)
      .mockReturnValueOnce(queryIdeasResult)
      .mockReturnValueOnce(queryResultEmpty)
      .mockReturnValueOnce(queryResultEmpty);

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseBody.id).toEqual(expectedBoardFetch.id);

    for (const idea of responseBody.ideas) {
      expect(idea.votes).toEqual(0);
    }
  });

  test("200 - board has no ideas", async () => {
    mockSend.mockReturnValueOnce(getBoardResult).mockReturnValueOnce(queryResultEmpty);

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseBody.id).toEqual(expectedBoardFetch.id);
    expect(responseBody.ideas.length).toEqual(0);
  });

  test("400 - path variable 'boardId' is required", async () => {
    // @ts-ignore
    const eventMissingBoardId: APIGatewayProxyEvent = {};

    const response = await handler(eventMissingBoardId);

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual(JSON.stringify({ message: "path variable 'boardId' is required" }));
  });
});
