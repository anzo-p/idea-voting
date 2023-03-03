import { PutCommand } from "@aws-sdk/lib-dynamodb";

import { handler } from "./index";

const mockSend = {
  send: jest.fn().mockImplementation(() => {
    return {
      promise: jest.fn(),
    };
  }),
};

jest.mock("@aws-sdk/client-dynamodb", () => {
  const originalModule = jest.requireActual("@aws-sdk/client-dynamodb");

  return {
    __esModule: true,
    ...originalModule,
    DynamoDBClient: jest.fn().mockImplementation(() => {
      return {
        send: (a: PutCommand) => mockSend.send(a),
      };
    }),
  };
});

describe("createBoard", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("201 success", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {
          claims: {
            sub: "123",
          },
        },
      },
      body: JSON.stringify({
        name: "boardName",
        description: "boardDescription",
        isPublic: true,
      }),
    };

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);
    const puCommand = mockSend.send.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(responseBody.message).toBe("board created");

    expect(mockSend.send).toBeCalledTimes(1);

    expect(puCommand.TableName).toEqual("test-single-table");
    expect(puCommand.Item.boardName).toEqual("boardName");
    expect(puCommand.Item.description).toEqual("boardDescription");
    expect(puCommand.Item.id).toEqual(responseBody.id);
    expect(puCommand.Item.isPublic).toEqual(true);
    expect(puCommand.Item.ownerId).toEqual("123");
    expect(puCommand.Item.pk).toEqual("board");
  });

  test("201 success - publicity defaults to false", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        name: "boardName",
        description: "boardDescription",
      }),
    };

    const response = await handler(event);
    const puCommand = mockSend.send.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(mockSend.send).toBeCalledTimes(1);
    expect(puCommand.Item.isPublic).toEqual(false);
  });

  test("201 success - description is optional", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        name: "boardName",
      }),
    };

    const response = await handler(event);
    const puCommand = mockSend.send.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(mockSend.send).toBeCalledTimes(1);
    expect(puCommand.Item.description).toEqual("");
  });

  test("201 success - anonymous", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        name: "boardName",
        description: "boardDescription",
        isPublic: false,
      }),
    };

    const response = await handler(event);
    const puCommand = mockSend.send.mock.calls[0][0].input;

    expect(response.statusCode).toBe(201);
    expect(mockSend.send).toBeCalledTimes(1);
    expect(puCommand.Item.ownerId).toEqual("anonymous");
  });

  test("400 bad request - on invalid payload will not store into db", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        description: "boardDescription",
        isPublic: false,
      }),
    };

    const response = await handler(event);
    const responseBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(responseBody.message).toBe("'name' is required'");
    expect(mockSend.send).toBeCalledTimes(0);
  });

  test("500 bad request - on general error will not store into db", async () => {
    // @ts-ignore
    const event: APIGatewayProxyEvent = {};

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(mockSend.send).toBeCalledTimes(0);
  });
});
