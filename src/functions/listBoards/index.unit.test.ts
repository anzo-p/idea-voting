import { mockSend, emptyResult } from "src/__mock__/mockDynamoDBClient";

import { QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";

import { BoardRecord } from "src/types/dynamo";
import { handler, publicBoards } from ".";

const expectedFetch: Record<string, any>[] = [uuid(), uuid()].map((boardId) => {
  return {
    id: boardId,
    pk: "board",
    sk: Date.now().toString(),
    ownerId: uuid(),
    boardName: `board number ${boardId}`,
    description: "a board of some despcription or another",
    isPublic: true,
    date: Date.now(),
  };
});

describe("createBoard", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("200 success", async () => {
    // @ts-ignore
    const result: QueryCommandOutput = {
      Items: expectedFetch,
    };

    mockSend.mockReturnValue(result);

    const response = await handler();
    const queryCommand = mockSend.mock.calls[0][0].input;
    const expectedRespnse = expectedFetch.map(({ pk, sk, ...rest }) => rest);

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(JSON.stringify(expectedRespnse));

    expect(mockSend).toBeCalledTimes(1);

    expect(queryCommand.TableName).toEqual("test-idea-voting-table");
    expect(queryCommand.IndexName).toEqual("gsi1");
    expect(queryCommand.KeyConditionExpression).toEqual("pk = :pkvalue");
    expect(queryCommand.ExpressionAttributeValues).toEqual({ ":pkvalue": "board" });
    expect(queryCommand.Limit).toEqual(10);
  });

  test("200 success - empty response", async () => {
    mockSend.mockReturnValue(emptyResult);

    const response = await handler();

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(JSON.stringify([]));
    expect(mockSend).toBeCalledTimes(1);
  });

  test("publicBoards", async () => {
    expectedFetch[0].isPublic = false;

    const result = publicBoards(expectedFetch as BoardRecord[]);

    expect(result).toStrictEqual(expectedFetch.slice(1));
  });
});
