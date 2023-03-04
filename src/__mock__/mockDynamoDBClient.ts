import { Command } from "@aws-sdk/smithy-client";

export const mockSend = jest.fn();

jest.doMock("@aws-sdk/client-dynamodb", () => {
  const originalModule = jest.requireActual("@aws-sdk/client-dynamodb");

  return {
    __esModule: true,
    ...originalModule,
    DynamoDBClient: jest.fn().mockImplementation(() => {
      return {
        send: (cmd: Command<any, any, any, any, any>) => mockSend(cmd),
      };
    }),
  };
});
