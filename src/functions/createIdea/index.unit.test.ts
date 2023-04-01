import { mockSend } from "src/__mock__/mockDynamoDBClient";

import { v4 as uuid } from "uuid";

import { handler } from ".";

const testBoardID = uuid();

describe("createBoard", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("201 success", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        boardId: testBoardID,
        title: "Gread Idea",
        description: "Lets see",
      }),
    };

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);
    const puCommand = mockSend.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(responseBody.message).toBe("Idea created");

    expect(mockSend).toBeCalledTimes(1);

    expect(puCommand.TableName).toEqual("test-idea-voting-table");
    expect(puCommand.Item.boardId).toEqual(testBoardID);
    expect(puCommand.Item.pk).toEqual(`idea-${testBoardID}`);
    expect(puCommand.Item.title).toEqual("Gread Idea");
    expect(puCommand.Item.description).toEqual("Lets see");
  });

  test("201 success - description is optional", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        boardId: testBoardID,
        title: "Gread Idea",
      }),
    };

    const response = await handler(event);
    const puCommand = mockSend.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(mockSend).toBeCalledTimes(1);
    expect(puCommand.Item.description).toBe("");
  });

  test("400 bad request - on invalid payload will not store into db", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({}),
    };

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(responseBody.message).toBe("'title' and 'boardId' are required'");
    expect(mockSend).toBeCalledTimes(0);
  });

  test("500 bad request - on general error will not store into db", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {};

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(mockSend).toBeCalledTimes(0);
  });
});
