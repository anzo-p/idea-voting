import { formatJSONResponse } from "@libs/APIResponses";

const defaultHeaders = {
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

describe("formatJSONResponse", () => {
  test("default response", () => {
    const response = formatJSONResponse({ body: "test" });

    expect(typeof response).toBe("object");
    expect(typeof response.body).toBe("string");

    expect(response.statusCode).toBe(200);
    expect(response.headers).toStrictEqual(defaultHeaders);
    expect(response.body).toBe(JSON.stringify("test"));
  });

  test("accept statusCode as argument", () => {
    for (var statusCode of [200, 201, 400, 401, 403, 404, 500]) {
      const response = formatJSONResponse({ body: "test", statusCode });

      expect(response.statusCode).toBe(statusCode);
    }
  });

  test("accept complex payload as argument", () => {
    const payload = {
      outer: {
        inner: [
          {
            field: "value",
          },
          {
            another: 1,
          },
        ],
      },
    };

    const response = formatJSONResponse({ body: payload });

    expect(response.body).toBe(JSON.stringify(payload));
  });

  test("accept headers as argument", () => {
    const headers = {
      "Header-1": "value-1",
      "Header-2": "value-2",
    };

    const response = formatJSONResponse({ body: "test", statusCode: 200, headers });

    expect(response.headers).toEqual({
      ...defaultHeaders,
      ...headers,
    });
  });
});
