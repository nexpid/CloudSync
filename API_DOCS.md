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

The format of the data Cloud Sync saves. Can be viewed [here](./src/lib/db/index.ts).

### Compressed data format

A custom base64 brotli compressed format of [the data](#data-format) that's used for storage.

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
      - Returns **`200`** `OK` with [the saved data](#data-format) (includes a `Last-Modified` header) on success
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🟠 **`PUT`** `/api/data` [🔒](#authentication)
      - Requires an `application/json` body in the format of [saved data](#data-format)
      - Returns **`200`** `OK` with `true` on success
      - Returns **`400`** `BAD REQUEST` with helpful zod error messages on invalid body
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🔴 **`DELETE`** `/api/data` [🔒](#authentication)
      - Returns **`200`** `OK` with `true` on success
      - Returns **`500`** `INTERNAL SERVER ERROR` on an unknown server error
    - 🟢 **`GET`** `/api/data/raw` [🔒](#authentication)
      - Returns the raw [compressed saved data](#compressed-data-format)
      - Returns **`200`** `OK` with `true` (includes `Content-Disposition` and `Last-Modified` headers) on success
      - Returns **`204`** `NO CONTENT` on no content
      - Returns **`500`** `INTERNAL SERVER ERROR` on unknown error
    - 🟣 **`POST`** `/api/data/decompress` [🔒](#authentication)
      - Turns [compressed saved data](#compressed-data-format) in the `body` into normal [saved data](#data-format)
      - Returns **`200`** `OK` with [saved data](#data-format) on success
      - Returns **`400`** `BAD REQUEST` on invalid body
