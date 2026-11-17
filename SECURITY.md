# Security policy

## Supported versions

TeleVault is developed on `main`. Only the latest commit on `main` receives
security fixes. There are no long-term support branches.

<!-- VERIFY: supported versions and release channels. The repository has no tagged releases yet. -->

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| Older   | :x:                |

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report privately through GitHub's [Security Advisories](https://github.com/hsay123/TeleVaultt/security/advisories/new)
flow. If you cannot use advisories, email
**[security@televault.example](mailto:security@televault.example)**.

<!-- VERIFY: the security contact address is a placeholder and must be replaced with a real, monitored mailbox before launch. -->

Please include:

- a description of the issue and the impact you believe it has
- steps to reproduce, or a proof of concept
- the affected commit, browser or operating system
- any suggested fix, if you have one

## What to expect

| Stage                     | Target                         |
| ------------------------- | ------------------------------ |
| Acknowledgement of report | within 3 working days          |
| Initial assessment        | within 7 working days          |
| Fix or mitigation plan    | within 30 days where practical |
| Public disclosure         | coordinated with the reporter  |

These are best-effort targets for a volunteer project, not a service-level
agreement. We will keep you informed if a fix takes longer.

## Scope

This policy covers the TeleVault website in the `TeleVaultt` repository. The
desktop app lives in `hsay123/TGDrive`; it does not have a security policy of
its own yet. In-scope website issues include, for example, cross-site scripting
in page scripts, dependency vulnerabilities that affect the shipped bundle, and
leaked secrets.

Out of scope: findings that require a compromised device or browser extension,
denial of service from unrealistic traffic volumes, and reports about the
Telegram service itself.

## Safe harbour

We will not pursue legal action against researchers who act in good faith,
follow this policy, avoid privacy violations and data destruction, and give us
reasonable time to fix the issue before disclosure.

## Preferred languages

We prefer reports in English.

## Attribution

We are happy to credit reporters in the advisory and in
[CHANGELOG.md](CHANGELOG.md) unless you ask to stay anonymous.
