# komoot-cli

[![npm version](https://img.shields.io/npm/v/komoot-cli.svg)](https://www.npmjs.com/package/komoot-cli)
[![npm downloads](https://img.shields.io/npm/dm/komoot-cli.svg)](https://www.npmjs.com/package/komoot-cli)
[![license](https://img.shields.io/npm/l/komoot-cli.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/komoot-cli.svg)](https://www.npmjs.com/package/komoot-cli)

An unofficial command-line client for your [Komoot](https://www.komoot.com) account: list,
view, download, edit, delete, and upload routes ("tours") from the terminal.

> **Disclosure:** Komoot has no public developer API. This tool talks to `api.komoot.de`,
> the internal API Komoot's own web/mobile apps use. It is reverse-engineered, unversioned
> for external use, and could change or break at any time. Use at your own risk, for
> personal accounts only.

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
  - [Examples](#examples)
  - [Editing routes](#editing-routes)
- [Security & credential storage](#security--credential-storage)
- [Development](#development)
- [Project layout](#project-layout)
- [License](#license)
- [Contributing](#contributing)

## Features

- List, view, edit, delete, and upload Komoot tours from the terminal.
- Download tours as **GPX** or **FIT**.
- Browse another user's **public** tours without logging in (`--user <id>`).
- Credentials stored via the OS keychain (Secret Service D-Bus on Linux), with a
  locked-down plaintext fallback when a keychain isn't available.
- Human-readable table output by default, or `--json` for scripting.

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

### Examples

List your own tours:

```sh
$ komoot-cli routes list --sport hike --limit 3
ID         NAME                        ELEVATION UP   STATUS    DISTANCE   DURATION
987654321  Alpine ridge loop           842 m          public    18.4 km    5h12m
987654320  Sunday forest walk          120 m          private   7.2 km     1h45m
987654319  Coastal trail out-and-back  205 m          public    12.9 km    3h05m

Page 1 of 4
```

Download a tour as GPX:

```sh
$ komoot-cli routes download 987654321 --format gpx
Saved 987654321.gpx
```

Browse a public user's tours without logging in:

```sh
$ komoot-cli routes list --user 123456 --type tour_planned --json
{
  "_embedded": {
    "tours": [ ... ]
  }
}
```

### Editing routes

`routes edit` only changes a tour's metadata (name, sport, status). Waypoint/path
editing of an already-saved tour is not supported by this API surface — see the plan
document for details.

## Security & credential storage

`komoot-cli login` stores your Komoot session in the OS-native credential store where
one is available: on Linux, via a Secret Service D-Bus provider such as GNOME Keyring or
KWallet.

If no keychain backend is reachable, credentials fall back to a JSON file at
`~/.config/komoot-cli/credentials.json`, created with `chmod 600` (owner read/write
only), and a warning is printed to stderr so you know the fallback was used. `--verbose`
logging never includes credentials.

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

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

Bug reports and pull requests are welcome — please open one at
[github.com/albertoielpo/komoot-cli/issues](https://github.com/albertoielpo/komoot-cli/issues).
