import { PutCommand } from "@aws-sdk/lib-dynamodb";

export const mockSend = jest.fn().mockImplementation(() => {
  return {
    promise: jest.fn(),
  };
});

jest.doMock("@aws-sdk/client-dynamodb", () => {
  const originalModule = jest.requireActual("@aws-sdk/client-dynamodb");

  return {
    __esModule: true,
    ...originalModule,
    DynamoDBClient: jest.fn().mockImplementation(() => {
      return {
        send: (a: PutCommand) => mockSend(a),
      };
    }),
  };
});
