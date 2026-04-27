# Security Review — 2026-04-27

## No Hardcoded Secrets Found

No API keys, tokens, or passwords are hardcoded anywhere. The deploy script correctly prompts for credentials at runtime via `read -sp` and never persists them. `.gitignore` properly excludes `.env` files.

---

## Issues Found

### 1. Real IP Exfiltration via Third-Party API — `src/script.js:48`
```js
fetch('https://api.ipify.org?format=json')
  .then(data => { visitorIP = data.ip; })
```
The visitor's real IP is silently fetched from a third-party service and stored. That IP then appears in the matrix display (`getSystemInfo()`). This is a **privacy concern** — users don't consent to having their IP sent to ipify.org. It also creates a third-party dependency that could be abused (e.g., replaced with a malicious endpoint).

**Fix:** Remove this or display a fake/local IP purely for aesthetics (the display is decorative anyway).

---

### 2. No Security Headers in nginx — `docker/nginx.conf` and `deploy/setup.sh`
Neither nginx config sets any security headers:
- No `Content-Security-Policy` — allows arbitrary script injection
- No `X-Content-Type-Options: nosniff`
- No `X-Frame-Options: DENY` (clickjacking)
- No `Referrer-Policy`

**Fix:** Add an `add_header` block to both nginx configs.

---

### 3. README Exposed via nginx — `deploy/setup.sh:62`
```sh
cp ./README.md /var/www/html/
```
The nginx config serves `.md` files as static content (`location ~* \.(js|css|html|md)$`), meaning `README.md` is publicly accessible. This leaks deployment instructions and infrastructure details to anyone who visits `/README.md`.

**Fix:** Remove the `.md` rule from the location block, or don't copy README to the web root.

---

### 4. Simulated "Hacking" Content — `src/script.js:77-79`
```js
() => `FILE://${['etc/shadow', 'root/.ssh', ...]} 🔓`,
() => `SCAN:${['NMAP', 'MASSCAN'...]} TARGET_RANGE:${generateIPAddress()}/16`,
() => `EXPLOIT:${['buffer_overflow', 'sql_inject', 'xss_payload', 'privesc']} [ACTIVE]`,
```
Decorative/thematic content (it's a Matrix screensaver). Not a direct vulnerability, but displaying `EXPLOIT: sql_inject [ACTIVE]` alongside the visitor's **real IP** (see issue #1) could be alarming or misleading to visitors who don't understand it's fake.

---

### 5. `curl -k` (TLS Verification Disabled) — `deploy/deploy-to-proxmox.sh:76`
```sh
curl -s -k -X POST "https://${PROXMOX_HOST}:8006/..."
```
The `-k` flag skips TLS certificate validation for all Proxmox API calls, including the authentication request that sends a password. On an untrusted network this is vulnerable to MITM.

**Fix:** Use a proper cert or `--cacert` pointing to the Proxmox CA cert instead of `-k`.

---

## Summary

| Issue | Severity |
|---|---|
| IP exfiltration to ipify.org | Medium |
| No nginx security headers | Medium |
| README exposed at `/README.md` | Low |
| `-k` TLS skip in deploy script | Low–Medium (depends on network trust) |
| Decorative exploit strings + real IP | Low |
