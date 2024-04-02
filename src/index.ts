import { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import { OAuth2Strategy } from "remix-auth-oauth2";

export type LinkedInScope = "openid" | "profile" | "email";

/**
 * This type declares what configuration the strategy needs from the
 * developer to correctly work.
 * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow LinkedIn Auth Flow}
 */
export type LinkedInStrategyOptions = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  /**
   * @default "openid profile email"
   * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication?context=linkedin/context#permission-types Permisision}
   */
  scope?: LinkedInScope[] | string;
};

/**
 * In order to be complaint with the OAuth2Profile type as much as possible
 * based on the information Linkedin gives us.
 */
export interface LinkedInProfile extends OAuth2Profile {
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
    email: string;
    email_verified: boolean;
  };
}

export type LinkedInExtraParams = {
  scope: string;
} & Record<string, string | number>;

export const LinkedInStrategyDefaultName = "linkedin";
export const LinkedInStrategyScopeSeparator = " ";
export const LinkedInStrategyDefaultScopes: string = [
  "openid",
  "profile",
  "email",
].join(LinkedInStrategyScopeSeparator);

export class LinkedinStrategy<User> extends OAuth2Strategy<
  User,
  LinkedInProfile,
  LinkedInExtraParams
> {
  public name = LinkedInStrategyDefaultName;

  private readonly redirect_uri: string;
  private readonly userInfoURL = "https://api.linkedin.com/v2/userinfo";

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope = LinkedInStrategyDefaultScopes,
    }: LinkedInStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<LinkedInProfile, LinkedInExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: "https://www.linkedin.com/oauth/v2/authorization",
        tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      verify
    );

    this.scope = this.getScope(scope);
    this.redirect_uri = callbackURL;
  }

  // Allow users the option to pass a scope string, or typed array
  private getScope(scope: LinkedInStrategyOptions["scope"]): string {
    if (!scope) {
      return LinkedInStrategyDefaultScopes;
    } else if (Array.isArray(scope)) {
      return scope.join(LinkedInStrategyScopeSeparator);
    }

    return scope;
  }
  /**
   * We override the protected authorizationParams method to return a new
   * URLSearchParams with custom params we want to send to the authorizationURL.
   * Here we add the scope and the redirect_uri so Linkedin can use it, you can pass any extra param
   * you need to send to the authorizationURL here base on your provider.
   *
   * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS#step-2-request-an-authorization-code}
   * @returns {string} The new URL Search params
   */
  protected authorizationParams(): URLSearchParams {
    return new URLSearchParams({
      scope: this.scope || LinkedInStrategyDefaultScopes,
      redirect_uri: this.redirect_uri,
      response_type: "code",
    });
  }

  /**
   * We override how to use the accessToken to get the profile of the user.
   * Here we fetch a Linkedin specific URLs, get the profile data, the user email
   * and build the object based on the LinkedinProfile type.
   *
   * @see {@link https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin#retrieving-member-email-address Retrieving Email Address}
   * @param accessToken
   * @returns {LinkedInProfile} The Linkedin profile and the raw json response.
   */
  protected async userProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const raw: LinkedInProfile["_json"] = await response.json();
    const profile: LinkedInProfile = {
      provider: "linkedin",
      id: raw.sub,
      displayName: raw.name,
      name: {
        familyName: raw.family_name,
        givenName: raw.given_name,
      },
      emails: [{ value: raw.email }],
      photos: [{ value: raw.picture }],
      _json: raw,
    };
    return profile;
  }
}
