import { getUserId } from "./APIGateway";

describe("getUserId", () => {
  test("returns anonymous when no claims", () => {
    const event = {
      requestContext: {
        authorizer: {},
      },
    };

    const userId = getUserId(event as any);

    expect(userId).toEqual("anonymous");
  });

  test("returns anonymous when no sub claim", () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {},
        },
      },
    };

    const userId = getUserId(event as any);

    expect(userId).toEqual("anonymous");
  });

  test("returns userId from sub claim", () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: "123",
          },
        },
      },
    };

    const userId = getUserId(event as any);

    expect(userId).toEqual("123");
  });
});
