import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { LinkedinStrategy, defaultScope } from "../src";

const defaultOptions = {
  clientID: "CLIENT_ID",
  clientSecret: "CLIENT_SECRET",
  callbackURL: "https://example.app/callback",
};

const exampleRequestURL = "https://example.app/auth/linkedin";

describe(LinkedinStrategy, () => {
  const verify = jest.fn();

  // You will probably need a sessionStorage to test the strategy.
  const sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3tStRing"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should have the name of the strategy", () => {
    const strategy = new LinkedinStrategy(defaultOptions, verify);
    expect(strategy.name).toBe("linkedin");
  });

  test("should allow changing the scope", async () => {
    const strategy = new LinkedinStrategy(
      {
        ...defaultOptions,
        scope: "r_emailaddress",
      },
      verify
    );

    const request = new Request(exampleRequestURL);

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe("r_emailaddress");
    }
  });

  test("should throw using an invalid scope", async () => {
    try {
      const strategy = new LinkedinStrategy(
        {
          ...defaultOptions,
          scope: "some_scope",
        },
        verify
      );

      const request = new Request(exampleRequestURL);

      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      expect(error.message.includes("The scope is invalid.")).toBeTruthy;
    }
  });

  test(`should have the scope ${defaultScope} as default`, async () => {
    const strategy = new LinkedinStrategy(defaultOptions, verify);

    const request = new Request(exampleRequestURL);

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe(defaultScope);
    }
  });

  test("should correctly format the authorization URL", async () => {
    const strategy = new LinkedinStrategy(defaultOptions, verify);

    const request = new Request(exampleRequestURL);

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;

      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.hostname).toBe("www.linkedin.com");
      expect(redirectUrl.pathname).toBe("/oauth/v2/authorization");
    }
  });
});
