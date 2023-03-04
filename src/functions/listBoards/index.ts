import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { BoardRecord } from "src/types/dynamo";

export const handler = async () => {
  try {
    const tableName = process.env.singleTable;

    const boards = await Dynamo.query<BoardRecord>({
      tableName,
      index: "gsi1",
      pkKey: "pk",
      pkValue: "board",
      limit: 10,
    });

    const result = publicBoards(boards).map(({ pk, sk, ...rest }) => rest);

    return formatJSONResponse({
      body: result,
    });
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      body: error.message,
    });
  }
};

export const publicBoards = (boards: BoardRecord[]) => boards.filter((board) => board.isPublic);
