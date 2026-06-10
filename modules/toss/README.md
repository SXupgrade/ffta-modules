# Toss module

Provably fair random toss and draw module for FFTA Modules / Compet+.

## Features

- Coin toss mode (`Heads` / `Tails`).
- Draw mode from a custom list of options.
- Cryptographically secure random seed with `crypto.getRandomValues()`.
- SHA-256 commitment generated before reveal.
- Reveal proof JSON including seed, nonce, commitment and draw hash.
- Unbiased option selection using rejection sampling.
- Local history of revealed tosses.

## Security model

The module uses a commit-reveal flow:

1. Prepare: the browser generates a random seed and nonce, then computes a SHA-256 commitment over a canonical JSON payload.
2. Reveal: the same payload is verified, then a draw hash is computed and mapped to the selected option.
3. Audit: the exported JSON proof can be verified again by the module.

This is not an official gambling certification. It is designed to provide an auditable and transparent competition utility.
