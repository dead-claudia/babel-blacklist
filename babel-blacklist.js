"use strict"

// Simplify creating the records.
function v(major, minor, patch) {
    return {major: major | 0, minor: minor | 0, patch: patch | 0}
}

function e(version, blacklist) {
    return {version: version, blacklist: blacklist}
}

// Both lists are delta-encoded. It's easier to reason about and update with
// newly implemented features.

// The features that ship, and are on by default.
var defaults = [
    // ES5 features
    e(v(0, 0, 0), [
        "es3.memberExpressionLiterals",
        "es3.propertyLiterals",
        "es5.properties.mutators",
    ]),

    e(v(0, 11, 16), ["es6.spec.symbols"]),

    // io.js
    e(v(1, 0, 0), [
        "regenerator",
        "es6.blockScoping",
        "es6.forOf",
        "es6.templateLiterals",
    ]),

    e(v(2, 0, 0), ["es6.classes", "es6.properties.shorthand"]),
    e(v(3, 0, 0), ["es6.properties.computed"]),

    // After merge
    e(v(4, 0, 0), [
        "es6.arrowFunctions",
        "es6.constants",
    ]),
]

defaults.cache = []

// iojs/node 4+ staging
var staging = [
    // ES5 features
    e(v(0, 0, 0), [
        "es3.memberExpressionLiterals",
        "es3.propertyLiterals",
        "es5.properties.mutators",
    ]),

    // This was already shipping in node
    e(v(0, 11, 16), ["es6.spec.symbols"]),

    // io.js
    e(v(1, 0, 0), [
        "regenerator",
        "es6.blockScoping",
        "es6.forOf",
        "es6.templateLiterals",
    ]),

    e(v(1, 1, 0), ["es6.classes", "es6.properties.shorthand"]),

    // Can't include just rest parameters, as Babel batches that and
    // default parameters together (which V8 doesn't yet support).
    e(v(3, 0, 0), ["es6.spread", "es6.properties.computed"]),

    // After merge.
    // These kinda skipped the `staging` process.
    e(v(4, 0, 0), [
        "es6.arrowFunctions",
        "es6.constants",
    ]),
]

staging.cache = []

function getOrAdd(cache, i, f) {
    var value = cache[i]
    return value === undefined ? cache[i] = f() : value
}

function getBlacklist(list, version) {
    var blacklist = []

    for (var i = 0; i < list.length; i++) {
        var current = list[i]
        if (compareVersion(version, current.version) === -1) break
        [].push.apply(blacklist, current.blacklist)
    }

    return blacklist
}

function get(list, version) {
    var major = getOrAdd(list.cache, version.major, Array)
    var minor = getOrAdd(major, version.minor, Array)
    return getOrAdd(minor, version.patch, function () {
        return getBlacklist(list, version)
    })
}

function test(a, b) {
    return (a > b) - (a < b)
}

function compareVersion(a, b) {
    return test(a.major, b.major) ||
        test(a.minor, b.minor) ||
        test(a.patch, b.patch)
}

// To check if es-staging is enabled.
var hasStaging = process.execArgv.some(function (v) {
    return v === "--es-staging" || v === "--es_staging"
})

function parseVersion(version) {
    if (Array.isArray(version)) {
        return v(version[0], version[1], version[2])
    }

    if (typeof version !== "string") {
        throw new TypeError("Expected version to be a string")
    }

    var result = /^v?(\d+)(\.(\d+)(\.(\d+))?)?/.exec(version)

    if (result === null) {
        throw new TypeError("expected format vN.N.N or N.N.N")
    }

    return v(result[1], result[3], result[5])
}

function d(obj, def) {
    return obj == null ? def : obj
}

module.exports = function (version, isStaging) {
    if (typeof version === "number") {
        version = [+version, +d(isStaging, 0), +d(arguments[3], 0)]
        isStaging = arguments.length > 3 && arguments[4]
    } else {
        version = d(version, process.version)
    }

    if (isStaging == null) isStaging = hasStaging
    if (version == "") return []

    return get(isStaging ? staging : defaults, parseVersion(version))
}

function generateList(list) {
    var blacklist = []

    return list.map(function (current) {
        [].push.apply(blacklist, current.blacklist)
        var version = current.version
        return Object.freeze(e(
            Object.freeze(v(version.major, version.minor, version.patch)),
            Object.freeze(blacklist.slice())))
    })
}

function lazy(f) {
    var res

    return {
        configurable: true,
        enumerable: true,
        get: function () {
            if (!f) return res
            res = Object.freeze(f())
            f = null
            return res
        },
    }
}

Object.defineProperty(module.exports, "list", lazy(function () {
    return Object.defineProperties({}, {
        defaults: lazy(function () { return generateList(defaults) }),
        staging: lazy(function () { return generateList(staging) }),
        compareVersion: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: compareVersion,
        },
    })
}))
