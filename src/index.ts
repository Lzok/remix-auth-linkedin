import { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import { OAuth2Strategy } from "remix-auth-oauth2";

export const validScopes = [
  "r_liteprofile",
  "r_emailaddress",
  "w_member_social",
];
export const defaultScope = "r_liteprofile r_emailaddress";

/**
 * @param scopes
 * @param validScopes
 * @returns {boolean} if the scopes are invalid (true) or valid (false)
 */
function validateScopes(scopes: string, validScopes: string[]): boolean {
  const sc = scopes.split(" ");

  return sc.some((x) => !validScopes.includes(x));
}

/**
 * This type declares what configuration the strategy needs from the
 * developer to correctly work.
 * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow LinkedIn Auth Flow}
 */
export type LinkedinStrategyOptions = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  /**
   * @default "r_liteprofile r_emailaddress"
   * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication?context=linkedin/context#permission-types Permisision}
   */
  scope?: string;
};

export type BaseProfileResponse = {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
};

export type EmailElement = {
  /**
   * Inside this object lives the actual email address
   */
  "handle~": { emailAddress: string };
  /**
   * The URN representation of a member's handle.	Email Address URN.
   * @example 'urn:li:emailAddress:1700000484'
   * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/api-guide/concepts/urns URNS}
   */
  handle: string;
};

/**
 * @see {@link https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin#retrieving-member-email-address Retrieving Email Address}
 */
export type EmailData = {
  elements: EmailElement[];
};

/**
 * The authorization method for this artifact. Can be the following (string) enums:
 * @example
 * 'NONE' - The artifact can not be served to users.
 * 'PUBLIC' - The artifact is public and no authorization is needed to serve.
 * 'INTERNAL' - The artifact is only accessible internally to other systems in the hosting or processing infrastructure.
 * 'PRIVATE' - The artifact is private and only an authorized user can access it.
 */
type AuthorizationMethod = "NONE" | "PUBLIC" | "INTERNAL" | "PRIVATE";

type ProfilePictureIdentifier = {
  /**
   * @example
   * https://media-exp1.licdn.com/dms/image/XXXXXXXXXXXXXXXXXXX/profile-displayphoto-shrink_100_100/0/1634222246589?e=1649289600&v=beta&t=QX8EDhTpAS4mNcHHsOrpzbs6QKZhkIEGbnNxVC39WnE
   */
  identifier: string;
  index: number; // 0,
  /**
   * One of these media types.
   * @see {@link https://www.iana.org/assignments/media-types/media-types.xhtml media types.}
   * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/references/v2/digital-media-asset#asset-playable-streams-table Asset Playable Streams Table}
   * @default application/octet-stream
   * @example
   * 'image/jpeg'
   */
  mediaType: string;
  /**
   * @example
   * 'urn:li:digitalmediaFile:(urn:li:digitalmediaAsset:XXXXXXXXXXXXXXXXXXX,urn:li:digitalmediaArtifactClass:profile-displayphoto-shrink_100_100,0)'
   */
  file: string;
  /**
   * @example
   * 'EXTERNAL_URL'
   */
  identifierType: string;
  identifierExpiresInSeconds: number;
};

type ProfilePictureElement = {
  artifact: string;
  authorizationMethod: AuthorizationMethod;
  data: {
    "com.linkedin.digitalmedia.mediaartifact.StillImage": {
      /**
       * One of these media types.
       * @see {@link https://www.iana.org/assignments/media-types/media-types.xhtml media types.}
       * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/references/v2/digital-media-asset#asset-playable-streams-table Asset Playable Streams Table}
       * @default application/octet-stream
       * @example
       * 'image/jpeg'
       */
      mediaType: string;
      /**
       * @example
       * rawCodecSpec: { name: 'jpeg', type: 'image' }
       */
      rawCodecSpec: { name: string; type: string };
      /**
       * @example
       * displaySize: { width: 100, uom: 'PX', height: 100 }
       */
      displaySize: {
        width: number;
        uom: string;
        height: number;
      };
      /**
       * @example
       * storageSize: { width: 100, height: 100 }
       */
      storageSize: { width: number; height: number };
      /**
       * @example
       * storageAspectRatio: { widthAspect: 1, heightAspect: 1, formatted: '1.00:1.00' }
       */
      storageAspectRatio: {
        widthAspect: number;
        heightAspect: number;
        formatted: string;
      };
      /**
       * @example
       * displayAspectRatio: { widthAspect: 1, heightAspect: 1, formatted: '1.00:1.00' }
       */
      displayAspectRatio: {
        widthAspect: number;
        heightAspect: number;
        formatted: string;
      };
    };
  };
  identifiers: ProfilePictureIdentifier[];
};

/**
 * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/references/v2/digital-media-asset Digital Media Asset Schema}
 */
export type ProfilePictureData = {
  profilePicture: {
    /**
     * The URN representation of a member's handle.	Email Address URN.
     * @example 'urn:li:digitalmediaAsset:C4E00000FGrr3FrSVRg'
     */
    displayImage: string;
    "displayImage~": {
      paging: { count: number; start: number; links: [] };
      elements: ProfilePictureElement[];
    };
  };
};

type LiteProfileData = BaseProfileResponse & ProfilePictureData;

/**
 * This type declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 *
 * @see {@link https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow#member-approves-request}
 */
export type LinkedinStrategyVerifyParams = {
  /**
   * The OAuth 2.0 authorization code.
   *
   * The code is a value that you exchange with LinkedIn for an OAuth 2.0 access token in the next step of the authentication process.
   * For security reasons, the authorization code has a 30-minute lifespan and must be used immediately.
   * If it expires, you must repeat all of the previous steps to request another authorization code.
   */
  code: string;
  /**
   * A value used to test for possible CSRF attacks.
   */
  state: string;
} & Record<string, string | number>;

/**
 * In order to be complaint with the OAuth2Profile type as much as possible
 * based on the information Linkedin gives us.
 */
export type LinkedinProfile = {
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
  _json: LiteProfileData & EmailData;
} & OAuth2Profile;

export class LinkedinStrategy<User> extends OAuth2Strategy<
  User,
  LinkedinProfile
> {
  public name = "linkedin";

  private readonly scope: string;
  private readonly redirect_uri: string;
  private readonly userInfoURL =
    "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))";
  private readonly userEmailURL =
    "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope = defaultScope,
    }: LinkedinStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<LinkedinProfile>
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

    if (scope !== defaultScope && validateScopes(scope, validScopes)) {
      throw new Error(
        `The scope is invalid. Remember valid ones are: ${validScopes.join(
          ", "
        )}`
      );
    }

    this.redirect_uri = callbackURL;
    this.scope = scope;
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
      scope: this.scope,
      redirect_uri: this.redirect_uri,
    });
  }

  /**
   * We override how to use the accessToken to get the profile of the user.
   * Here we fetch a Linkedin specific URLs, get the profile data, the user email
   * and build the object based on the LinkedinProfile type.
   *
   * @see {@link https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin#retrieving-member-email-address Retrieving Email Address}
   * @param accessToken
   * @returns {LinkedinProfile} The Linkedin profile and the raw json response.
   */
  protected async userProfile(accessToken: string): Promise<LinkedinProfile> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const responseFetcher = fetch(this.userInfoURL, { headers });
    const emailFetcher = fetch(this.userEmailURL, { headers });

    const [response, emailResponse] = await Promise.all([
      responseFetcher,
      emailFetcher,
    ]);

    const [baseData, emailData]: [LiteProfileData, EmailData] =
      await Promise.all([response.json(), emailResponse.json()]);

    const data = {
      provider: this.name,
      id: baseData.id,
      displayName: `${baseData.localizedFirstName} ${baseData.localizedLastName}`,
      name: {
        givenName: baseData.localizedFirstName,
        familyName: baseData.localizedLastName,
      },
      emails: [{ value: emailData?.elements?.[0]?.["handle~"]?.emailAddress }],
      photos: [
        {
          value:
            baseData.profilePicture?.["displayImage~"]?.elements?.[0]
              ?.identifiers?.[0]?.identifier,
        },
      ],
      _json: { ...baseData, ...emailData },
    };

    return data;
  }
}
