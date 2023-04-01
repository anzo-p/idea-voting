import { formatJSONResponse } from "@libs/APIResponses";
import Dynamo from "@libs/Dynamo";
import { BoardRecord } from "src/types/dynamo";

export const handler = async () => {
  try {
    const tableName = process.env.IDEA_VOTING_TABLE;

    console.log("tableName", tableName);

    const boards = await Dynamo.query<BoardRecord>({
      tableName,
      index: "gsi1",
      pkKey: "pk",
      pkValue: "board",
      limit: 10,
    });

    console.log("boards", boards);

    const result = publicBoards(boards).map(({ pk, sk, ...rest }) => {
      return rest;
    });

    console.log("result", result);

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
