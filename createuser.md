# createUser()

Creates a [`User`](https://clerk.com/docs/reference/backend/types/backend-user.md?sdk=js-backend).

Your user management settings in the [Clerk Dashboard](https://dashboard.clerk.com/~/user-authentication/user-and-authentication) determine how you should setup your user model. Anything **Required** in **Users & Authentication → User & authentication** will need to be provided when creating a user. Trying to add a field that isn't enabled in **Users & Authentication → User & authentication** will result in an error.

Any email address and phone number created using this method will be automatically marked as verified.

> This endpoint is [rate limited](https://clerk.com/docs/guides/how-clerk-works/system-limits.md?sdk=js-backend). For development instances, a rate limit rule of **100 requests per 10 seconds** is applied.
> For production instances, that limit goes up to **1000 requests per 10 seconds**.

```ts
function createUser(params: CreateUserParams): Promise<User>
```

## `CreateUserParams`

| Name                     | Type                | Description                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| externalId?              | string              | The ID of the user as used in your external systems. Must be unique across your instance.                                                                                                                                                                                                                           |
| firstName?               | string              | The user's first name.                                                                                                                                                                                                                                                                                              |
| lastName?                | string              | The user's last name.                                                                                                                                                                                                                                                                                               |
| emailAddress[]?         | string[]           | Email addresses to add to the user. Must be unique across your instance. The first email address will be set as the users primary email address.                                                                                                                                                                    |
| phoneNumber[]?          | string[]           | Phone numbers that will be added to the user. Must be unique across your instance. The first phone number will be set as the users primary phone number.                                                                                                                                                            |
| web3\_wallet[]?         | string[]           | Web3 wallet addresses that will be added to the user. Must be unique across your instance. The first wallet will be set as the users primary wallet.                                                                                                                                                                |
| username?                | string              | The username to give to the user. Must be unique across your instance.                                                                                                                                                                                                                                              |
| password?                | string              | The plaintext password to give the user. Must be at least 8 characters long, and can not be in any list of hacked passwords.                                                                                                                                                                                        |
| passwordDigest?          | string              | In case you already have the password digests and not the passwords, you can use them for the newly created user via this property. The digests should be generated with one of the supported algorithms. The hashing algorithm can be specified using the password\_hasher property.                               |
| awscognito               | bcrypt              | If you need support for any particular hashing algorithm, contact support.                                                                                                                                                                                                                                          |
| skipPasswordChecks?      | boolean             | When set to true, all password checks are skipped. It is recommended to use this method only when migrating plaintext passwords to Clerk. Upon migration the user base should be prompted to pick stronger password.                                                                                                |
| skipPasswordRequirement? | boolean             | When set to true, password is not required anymore when creating the user and can be omitted. This is useful when you are trying to create a user that doesn't have a password, in an instance that is using passwords. You cannot use this flag if password is the only way for a user to sign into your instance. |
| totpSecret?              | string              | In case TOTP is configured on the instance, you can provide the secret to enable it on the newly created user without the need to reset it. Currently, the supported options are: Period: 30 secondsCode length: 6 digitsAlgorithm: SHA1                                                                            |
| backupCodes?             | string[]           | If backup codes are configured on the instance, you can provide them to enable it on the newly created user without the need to reset them. You must provide the backup codes in plain format or the corresponding bcrypt digest.                                                                                   |
| publicMetadata?          | UserPublicMetadata  | Metadata that can be read from the Frontend API and Backend API and can be set only from the Backend API.                                                                                                                                                                                                           |
| privateMetadata?         | UserPrivateMetadata | Metadata that can be read and set only from the Backend API.                                                                                                                                                                                                                                                        |
| unsafeMetadata?          | UserUnsafeMetadata  | Metadata that can be read and set from the Frontend API. It's considered unsafe because it can be modified from the frontend.                                                                                                                                                                                       |
| legalAcceptedAt?         | Date                | The date when the user accepted the legal documents. null if Require express consent to legal documents is not enabled.                                                                                                                                                                                             |
| skipLegalChecks?         | boolean             | When set to true all legal checks are skipped. It is not recommended to skip legal checks unless you are migrating a user to Clerk.                                                                                                                                                                                 |
| createdAt                | Date                | A custom date/time denoting when the user signed up to the application, specified in RFC3339 format. For example: 2012-10-20T07:15:20.902Z.                                                                                                                                                                         |

## Usage

> Using `clerkClient` varies based on your framework. Refer to the [`JS Backend SDK overview`](https://clerk.com/docs/js-backend/getting-started/quickstart.md) for usage details, including guidance on [`how to access the userId and other properties`](https://clerk.com/docs/js-backend/getting-started/quickstart.md#get-the-user-id-and-other-properties).

```tsx
const response = await clerkClient.users.createUser({
  firstName: 'Test',
  lastName: 'User',
  emailAddress: ['testclerk123@gmail.com'],
  password: 'password',
})
```

## Example

**Next.js**

```ts {{ filename: 'app/api/example/route.ts' }}
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const client = await clerkClient()
  const user = await client.users.createUser({
    emailAddress: ['test@example.com'],
    password: 'password',
  })

  return NextResponse.json({ message: 'User created', user })
}
```

**Astro**

```tsx {{ filename: 'src/api/example.ts' }}
import type { APIRoute } from 'astro'
import { clerkClient } from '@clerk/astro/server'

export const POST: APIRoute = async (context) => {
  await clerkClient(context).users.createUser({
    emailAddress: ['test@example.com'],
    password: 'password',
  })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

**Express**

```ts {{ filename: 'public.ts' }}
import { getAuth, clerkClient } from '@clerk/express'

app.post('/createUser', async (req, res) => {
  await clerkClient.users.createUser({
    emailAddress: ['test@example.com'],
    password: 'password',
  })

  res.status(200).json({ success: true })
})
```

**React Router**

```tsx {{ filename: 'app/routes/example.tsx' }}
import { clerkClient } from '@clerk/react-router/server'
import type { Route } from './+types/example'
import { json } from 'react-router-dom'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const emailAddress = formData.get('emailAddress')
  const password = formData.get('password')

  await clerkClient.users.createUser({
    emailAddress: [emailAddress],
    password: password,
  })

  return json({ success: true })
}
```

**TanStack React Start**

```tsx {{ filename: 'app/routes/api/example.tsx' }}
import { json } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { clerkClient } from '@clerk/tanstack-react-start/server'

export const ServerRoute = createFileRoute('/api/example')({
  server: {
    handlers: {
      POST: async () => {
        await clerkClient().users.createUser({
          emailAddress: ['test@example.com'],
          password: 'my-secure-password',
        })

        return json({ success: true })
      },
    },
  },
})
```

## Backend API (BAPI) endpoint

This method in the SDK is a wrapper around the BAPI endpoint `POST/users`. See the [BAPI reference](https://clerk.com/docs/reference/backend-api/tag/users/post/users.md?sdk=js-backend){{ target: '_blank' }} for more information.

Here's an example of making a request directly to the endpoint using cURL.

Replace `YOUR_SECRET_KEY` with your Clerk Secret Key.

```bash {{ filename: 'terminal' }}
  curl 'https://api.clerk.com/v1/users' -X POST -H 'Authorization:Bearer {{secret}}' -H 'Content-Type:application/json' -d '{
    "email_address": ["test@example.com"],
    "password": "my-secure-password"
  }'
```

---

## Sitemap

[Overview of all docs pages](https://clerk.com/docs/llms.txt)
