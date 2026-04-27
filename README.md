# GUARDIANBOX

Standard file
sharing services often store files in a way that
the provider can access them. For sensitive documents legal
contracts, financial records, intellectual property this creates
an unacceptable risk. GuardianBox is a web based service that
provides simple, secure, end to end encrypted file sharin g.
Files are encrypted in the browser before being uploaded to
the server and can only be decrypted by the recipient with a
shared password. The server only stores encrypted data blobs,
meaning even the platform administrators cannot access the
file contents.

Key Features: 
1. In Browser Encryption: Files are encrypted using the Web
Crypto API before any data is sent to the server.
2. Password Protected Links: The uploader sets a password that
is required for decryption. This password is never sent to the
server.
3. Disposable Links: Uploaders can set an expiration time (e.g.,
24 hours) or a download limit (e.g., one time download) after
which the file is permanently deleted from the server.
4. Simple Interface: A clean, drag
and drop UI for uploading
files and generating a secure link.
5. File Size Limits: Different file size limits based on the user's
subscription tier.

## Live Demo
- https://vedastuk.github.io/GuardianBox/
