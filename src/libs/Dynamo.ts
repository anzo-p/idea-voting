import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

let options = {};
if (process.env.JEST_WORKER_ID) {
  options = {
    endpoint: "http://localhost:8000",
    region: "local-env",
  };
}

const client = new DynamoDBClient(options);

type Item = Record<string, AttributeValue>;

const Dynamo = {
  write: async <T = Item>({ tableName, data }: { tableName: string; data: { [key: string]: any } }) => {
    const params: PutCommandInput = {
      TableName: tableName,
      Item: { ...data },
    };

    await client.send(new PutCommand(params));
    return params.Item as T;
  },

  update: async ({
    tableName,
    pkKey,
    pkValue,
    skKey,
    skValue,
    updateKey,
    updateValue,
  }: {
    tableName: string;
    pkKey: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    updateKey: string;
    updateValue: string;
  }) => {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: { [pkKey]: pkValue },
      UpdateExpression: `set #updateKey = :updateValue`,
      ExpressionAttributeValues: {
        ":updateValue": updateValue,
        ":pkValue": pkValue,
      },
      ExpressionAttributeNames: {
        "#updateKey": updateKey,
        "#pkKey": pkKey,
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: `#pkKey = :pkValue`,
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    const res = await client.send(new UpdateCommand(params));

    return res.Attributes;
  },

  get: async <T = Item>({
    pkKey = "id",
    pkValue,
    skKey,
    skValue,
    tableName,
  }: {
    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    tableName: string;
  }) => {
    const params = {
      TableName: tableName,
      Key: {
        [pkKey]: pkValue,
      },
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    const res = await client.send(new GetCommand(params));

    return res.Item as T;
  },

  query: async <T = Item>({
    tableName,
    index,
    pkKey = "pk",
    pkValue,
    skKey,
    skMin,
    skValue,
    skMax,
    skBeginsWith,
    limit,
    startFromRecord,
  }: {
    tableName: string;
    index: string;

    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    skMin?: number | string;
    skMax?: number | string;
    skBeginsWith?: string;
    limit?: number;
    startFromRecord?: Record<string, string>;
  }) => {
    if (skKey && !(skMin || skMax || skValue || skBeginsWith)) {
      throw Error("Need a skMin, skMax, skBeginsWith or skValue when a skKey is provided");
    }

    const skminExp = skMin ? `${skKey} > :skvaluemin` : "";
    const skmaxExp = skMax ? `${skKey} < :skvaluemax` : "";
    const skEqualsExp = skValue ? `${skKey} = :skkeyvalue` : "";
    const skBeginsWithExp = skBeginsWith ? `begins_with (${skKey}, :skBeginsWith)` : "";

    const skKeyExp =
      skMin && skMax
        ? `${skKey} BETWEEN :skvaluemin AND :skvaluemax`
        : skminExp || skmaxExp || skEqualsExp || skBeginsWithExp;

    let params: QueryCommandInput = {
      TableName: tableName,
      IndexName: index,
      KeyConditionExpression: `${pkKey} = :pkvalue${skKey ? ` AND ${skKeyExp}` : ""}`,
      ExpressionAttributeValues: {
        ":pkvalue": pkValue,
      },
      Limit: limit,
      ExclusiveStartKey: startFromRecord ? startFromRecord : undefined,
    };

    if (!skKey) {
      delete params.ExpressionAttributeValues[":skvaluemax"];
      delete params.ExpressionAttributeValues[":skvaluemin"];
    } else {
      if (skMin) {
        params.ExpressionAttributeValues[":skvaluemin"] = skMin;
      }
      if (skMax) {
        params.ExpressionAttributeValues[":skvaluemax"] = skMax;
      }
      if (skValue) {
        params.ExpressionAttributeValues[":skkeyvalue"] = skValue;
      }
      if (skBeginsWith) {
        params.ExpressionAttributeValues[":skBeginsWith"] = skBeginsWith;
      }
    }

    const command = new QueryCommand(params);
    const res = await client.send(command);

    return res.Items as T[];
  },

  delete: async ({
    pkKey = "id",
    pkValue,
    skKey,
    skValue,
    tableName,
  }: {
    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    tableName: string;
  }) => {
    const params = {
      TableName: tableName,
      Key: {
        [pkKey]: pkValue,
      },
      ExpressionAttributeNames: {
        "#pkKey": pkKey,
      },
      ExpressionAttributeValues: {
        ":pkValue": pkValue,
      },
      ConditionExpression: `#pkKey = :pkValue`,
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    return await client.send(new DeleteCommand(params));
  },
};

export default Dynamo;
