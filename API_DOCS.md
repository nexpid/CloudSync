# API Documentation

API specification for custom implementations

## Concepts

### Authentication

Certain routes require authentication in the form of a **JWT token** in the `Authorization` header, or passed as an `auth` query parameter (should only be used in cases where using the header isn't possible). This token is provided by `/api/auth/authorize`.

### Error handling

Errors are sent as plaintext in a human readable format. Any response code in the range of **>=400 and `<=500** is an error and should be treated as such.

### Ratelimits

A ratelimit of **max 20 requests/10s per user** is enforced on any route which requires authentication. If surpassed, you will get a **`429`** `TOO MANY REQUESTS` response code.

### Data format

The format of the data Song Spotlight saves. Can be viewed [here](./src/lib/db/index.ts). In production, the maximum amount of entries (songs) allowed is **6**. During development, this limit is removed for easier testing.

### Invalid song format

Format of `[status: number, song: Song][]`, where `status` indicates the **HTTP status code** of the corresponding song. Meaning a `status` of **`200`** `OK` means the song is valid, while any other status code signals that the song is invalid. You can view the code [here](./src/api/data.ts)

## Routes

- `/api`
  - 🟢 **`GET`** `/api/bench/:test` [🔒](#authentication)
    - Requires user to be `env.ADMIN_USER_ID`
    - A `test` can be `will-error-client`, `will-crash-server` or `will-timeout`
    - Returns **`400`** `BAD REQUEST`, **`500`** `INTERNAL SERVER ERROR` or **`204`** `NO CONTENT` on success
    - Returns **`418`** `I AM A TEAPOT` on missing test
  - `/api/auth`
    - 🟢 **`GET`** `/api/auth/authorize`
      - Requires a `code` query parameter from the [Discord OAuth2 api](https://discord.com/developers/docs/topics/oauth2#authorization-code-grant)
      - Returns **`200`** `OK` with a signed JWT token used for authentication on success
      - Returns **`400`** `BAD REQUEST` or **`500`** `INTERNAL SERVER ERROR` on an auth error
  - `/api/data`
    - 🟢 **`GET`** `/api/data` [🔒](#authentication)
      - Returns **`200`** `OK` with [the saved songs](#data-format) (includes a `Last-Modified` header) on success
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🟢 **`GET`** `/api/data/:id` [🔒](#authentication)
      - Requires an `id` path parameter in the form of a Discord user id [Snowflake](https://discord.com/developers/docs/reference#snowflakes)
      - Returns **`200`** `OK` with [the user's saved songs](#data-format) (includes a `Last-Modified` header) on success
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🟠 **`PUT`** `/api/data/:id?` [🔒](#authentication)
      - Allows an optional `id` path parameter in the form of a Discord user id [Snowflake](https://discord.com/developers/docs/reference#snowflakes)
        - If the provided `id` doesn't match the user's id, requires user to be `env.ADMIN_USER_ID`
        - If user is indeed `env.ADMIN_USER_ID`, saves the body to `id` instead of the user's id
      - Requires an `application/json` body in the format of [saved songs](#data-format)
      - Returns **`200`** `OK` with `true` on success
      - Returns **`400`** `BAD REQUEST` with helpful zod error messages on invalid body (`string`) or [invalid songs](#invalid-song-format) (`json`)
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🔴 **`DELETE`** `/api/data` [🔒](#authentication)
      - Returns **`200`** `OK` with `true` on success
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
