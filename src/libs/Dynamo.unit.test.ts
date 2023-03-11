import { v4 as uuid } from "uuid";

import Dynamo from "@libs/Dynamo";
import { BoardRecord } from "src/types/dynamo";

describe("Dynamo", () => {
  test("get", async () => {
    const now = Date.now();

    const data: BoardRecord = {
      id: uuid(),
      pk: "board",
      sk: now.toString(),
      ownerId: "anonymous",
      boardName: "cool board",
      description: "",
      isPublic: true,
      date: now,
    };

    await Dynamo.write({ tableName: "test-single-table", data });

    const res = await Dynamo.get<BoardRecord>({
      tableName: "test-single-table",
      pkValue: data.id,
    });

    expect(res).toEqual(data);
  });
});
