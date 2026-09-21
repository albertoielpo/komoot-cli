# komoot-cli

[![npm version](https://img.shields.io/npm/v/komoot-cli.svg)](https://www.npmjs.com/package/komoot-cli)

An unofficial command-line client for your [Komoot](https://www.komoot.com) account: list,
view, download, edit, delete, and upload routes ("tours") from the terminal.

> **Disclosure:** Komoot has no public developer API. This tool talks to `api.komoot.de`,
> the internal API Komoot's own web/mobile apps use. It is reverse-engineered, unversioned
> for external use, and could change or break at any time. Use at your own risk, for
> personal accounts only.

## Requirements

- Node.js 24 or newer.
- Linux with a Secret Service D-Bus provider (GNOME Keyring, KWallet, etc.) for keychain
  credential storage. If unavailable, credentials fall back to a `chmod 600` plaintext
  file at `~/.config/komoot-cli/credentials.json`.

## Install

From [npm](https://www.npmjs.com/package/komoot-cli):

```sh
npm install -g komoot-cli
```

Or from this directory:

```sh
npm install -g .
```

This builds the TypeScript sources (via the `prepare` script) and installs the
`komoot-cli` binary globally.

## Usage

```sh
komoot-cli login                          # prompts for email/password, stores a token
komoot-cli logout                         # clears stored credentials
komoot-cli whoami                         # shows the currently logged-in account

komoot-cli routes list [--user <id>] [--type tour_planned|tour_recorded]
                       [--sport <type>] [--name <substr>] [--limit N] [--page N] [--json]
komoot-cli routes show <tour-id> [--json]
komoot-cli routes download <tour-id> [--format gpx|fit] [--output <path>] [--user <id>]
komoot-cli routes edit <tour-id> [--name <str>] [--sport <type>] [--status public|private|friends]
komoot-cli routes delete <tour-id>
komoot-cli routes upload <file> [--sport <type>] [--name <str>] [--format gpx|fit|tcx]

--verbose          # print request/response logging to stderr (never logs credentials)
--help / -h        # on the root command and every subcommand
--version / -V     # root command only
```

`--user <id>` (a numeric Komoot user id) runs a command unauthenticated against that
user's **public** routes — no login required. Omit it to operate on your own account,
which requires having run `komoot-cli login` first.

### Editing routes

`routes edit` only changes a tour's metadata (name, sport, status). Waypoint/path
editing of an already-saved tour is not supported by this API surface — see the plan
document for details.

## Development

```sh
npm run build     # compile TypeScript to dist/
npm run watch     # compile on change
npm test          # run the Jest test suite (HTTP mocked, no live account access)
npm run lint      # type-check only
```

## Project layout

```
bin/komoot-cli.js      # shebang entry point
src/
  commands/             # one file per CLI (sub)command
  api/                  # HTTP client, auth/login, credential storage, tours API calls
  util/                 # table rendering, prompts, error handling
  config.ts             # paths, base URLs, sport/status enums
test/                   # Jest tests, HTTP mocked via undici's MockAgent
```
