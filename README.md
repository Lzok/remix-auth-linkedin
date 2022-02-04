# LinkedinStrategy

The Linkedin strategy is used to authenticate users against a Linkedin account. It extends the [OAuth2Strategy](https://github.com/sergiodxa/remix-auth-oauth2).

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |


## Usage

### Create an OAuth application

First you need to create a new application in the [Linkedin's developers page](https://developer.linkedin.com/). Then I encourage you to read [this documentation page](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?tabs=HTTPS#prerequisites), it explains how to configure your app and gives you useful information on the auth flow.
The app is mandatory in order to obtain a `clientID` and `client secret` to use with the Linkedin's API.

### Create the strategy instance

```ts
// linkedin.server.ts
import { createCookieSessionStorage } from 'remix';
import { Authenticator } from 'remix-auth';
import { LinkedinStrategy } from "remix-auth-linkedin";

// Personalize this options for your usage.
const cookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	maxAge: 24 * 60 * 60 * 1000 * 30,
	secrets: ['THISSHOULDBESECRET_AND_NOT_SHARED'],
	secure: process.env.NODE_ENV !== 'development',
};

const sessionStorage = createCookieSessionStorage({
	cookie: cookieOptions,
});

export const authenticator = new Authenticator<string>(sessionStorage, {
	throwOnError: true,
});

const linkedinStrategy = new LinkedinStrategy(
   {
      clientID: "YOUR_CLIENT_ID",
      clientSecret: "YOUR_CLIENT_SECRET",
      callbackURL: "https://example.com/auth/linkedin/callback";
   },
   async ({accessToken, refreshToken, extraParams, profile, context}) => {
      /*
         profile:
         type LinkedinProfile = {
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
      */

      // Get the user data from your DB or API using the tokens and profile
      return User.findOrCreate({ email: profile.emails[0].value });
   }
);

authenticator.use(linkedinStrategy, 'linkedin');
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
   return (
      <Form action="/auth/linkedin" method="post">
         <button>Login with Linkedin</button>
      </Form>
   )
}
```

```tsx
// app/routes/auth/linkedin.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/linkedin.server'

export let loader: LoaderFunction = () => redirect('/login')
export let action: ActionFunction = ({ request }) => {
   return authenticator.authenticate('linkedin', request)
}
```

```tsx
// app/routes/auth/linkedin/callback.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/linkedin.server'

export let loader: LoaderFunction = ({ request }) => {
   return authenticator.authenticate('linkedin', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
   })
}
```