# iPhone call handoff with ntfy

Add these untracked server-side values to `.env`:

```env
NTFY_SERVER_URL="https://ntfy.sh"
NTFY_TOPIC="your-private-random-topic"
NTFY_TOKEN=""
```

Install the ntfy iOS app, subscribe to the exact configured topic on the same ntfy server, and allow notifications. Sign into the CRM and use **Test iPhone** to confirm delivery. On desktop, **Call number** sends a notification whose tap/action opens the iPhone Phone app; on mobile, it opens the phone app directly.
