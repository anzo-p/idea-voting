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
        isPublic: false,
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
    expect(puCommand.Item.isPublic).toEqual(false);
    expect(puCommand.Item.ownerId).toEqual("123");
    expect(puCommand.Item.pk).toEqual("board");
  });
});
