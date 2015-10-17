# babel-blacklist

Generates a blacklist for features available by default in Node/io.js based on version.

Install with `npm install --save-dev babel-blacklist` and use it like so (e.g. in a require hook):

```js
require("babel/register")({
  blacklist: require("babel-blacklist")()
})
```

This makes Babel only transpile what it needs to in your engine.

## Documentation

```js
blacklist(version?: string, isStaging?)
blacklist(version: [major, minor, patch], isStaging?)
```

- `version`

  If it's a string, it should be of either the form `"vN.N.N"` (like `"v0.12.0"`) or `"N.N.N"` (like `"0.12.0"`). It is permissible to omit the patch or even the minor, in which it defaults to 0. The 'major' field is required. Note that it doesn't accept shorthands like `"v0.12.x"` or other npm semver abbreviations. This does not use that syntax.

  If it's an array, it is treated as a 3-tuple `[major, minor, patch]`, where each of them are treated as numbers, coerced if they are not. The major field is required. The rest default to 0.

  This defaults to `process.version`.

- `isStaging`

  If truthy, use the table for io.js' `--es-staging` flag. Defaults to true if `version` is not given and `--es-staging` is set, false otherwise.

Calls to this are memoized.

```js
blacklist.list
```

Get a list of all the flags for each version. This an object with three keys:

- `defaults` - The features not needed by default.
- `staging` - The features not needed with `--es-staging`
- `compareVersion(a, b)` - Compare two versions `a` and `b`. Returns 1 if greater, 0 if same, and -1 if less.

Both `defaults` and `staging` are arrays of objects containing the following properties:

- `version` - An object of the form `{major, minor, patch}`, representing the relative version.
- `blacklist` - A list of strings safe for the Babel `blacklist` option.

Note that this property, `defaults`, and `staging` are lazy-loaded for memory reasons.

## License

This is licensed under the ISC License.
