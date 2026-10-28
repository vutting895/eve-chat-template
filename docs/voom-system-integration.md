# Voom AI Chat — standalone integration plan

## Product boundary

- Standalone chat repository: `vutting895/eve-chat-template`.
- Vercel project: `voom_ai_chat`.
- Keep this application separate from `vutting895/VOOM_SYSTEM-NOVA-AI`. Do not copy the NOVA frontend into this repository or merge the repositories.
- The chat application owns conversational UI and session history. NOVA remains the analysis/research system and the source of truth for its existing strategy and risk behavior.

## Integration targets

### 1. NOVA analysis and research

Use the existing `voom-system-nova-ai` Worker for authenticated strategy-draft analysis and the existing `voom-system-mcp` Remote MCP Worker for research tools, backtests, market candles, paper-risk validation, and authenticated read-only MT5 status.

Existing public health endpoints:
- `https://voom-system-nova-ai.suwapat787.workers.dev/health`
- `https://voom-system-mcp.suwapat787.workers.dev/health`

Health endpoints are not account status. User-specific analysis and MT5 reads must continue to use authenticated endpoints and the user's own permissions.

### 2. Authentication prerequisite

This repository currently uses Better Auth / Sign in with Vercel and stores chat data in Neon using Drizzle. The NOVA Worker/MCP currently expects a Supabase access token and enforces Supabase Auth/RLS for private resources. These identities are not interchangeable.

Before enabling the NOVA MCP connection, choose and implement a supported identity bridge (prefer a user-scoped Supabase sign-in/session that can be verified server-side). Never put a Supabase service-role key, long-lived user token, or broker secret into browser code, model context, public repository files, or a shared static MCP connection. Do not bypass tenant isolation with a service account.

### 3. MT5 order execution MCP

The current NOVA Remote MCP service is deliberately read-only. It has no order-submit, modify, or close tool. Direct trade execution therefore requires a separate execution-capable MCP service associated with this standalone chat project. The service must communicate with the intended MT5 terminal from the trusted Windows/VPS environment; Vercel and Cloudflare Workers are not substitutes for the terminal process.

The execution service is **not implemented or connected yet**. Do not configure a fictional MCP URL or claim this feature is operational. Build and test the service separately before adding the connection to `agent/connections/`.

Required controls before any order tool is enabled:
1. Bind the bridge to loopback and expose it only through a secured Cloudflare Tunnel/Access route; never expose the MT5 port or unauthenticated order endpoint directly to the Internet.
2. Authenticate every call and resolve a single authorized tenant/terminal server-side. Do not accept an arbitrary terminal address, tenant ID, broker account, or route from model input.
3. Verify Demo mode and account identity on the terminal server. Fail closed when the mode or tenant cannot be verified. Keep Live mode disabled by default.
4. Restrict MCP tools to an explicit allow-list. Read-only tools can be separate from order tools.
5. Put a server-side human approval gate on every order-changing action (place, modify, cancel, close). Approval must apply to the exact symbol, side, volume, entry type/price, stop loss, take profit, and expiry shown in the order preview—not merely to a general request to trade.
6. Validate symbol availability, volume limits/step, price freshness, spread, margin, stop levels, risk caps, daily loss limits, and the execution result. Never treat model confidence as a risk control.
7. Use a stable idempotency key to prevent duplicate orders on retries; record requests, approvals, responses, and rejection reasons without secrets.
8. Test unauthorized, expired-auth, wrong-tenant, wrong-account-mode, bad-symbol, invalid-volume, risk-limit, duplicate-request, timeout, and failed-order cases before allowing Demo execution.

## Suggested rollout

1. Correct the current health tool so it checks only the two known public health endpoints and clearly states that Worker health does not prove MT5 connectivity.
2. Add the user-scoped auth bridge required for NOVA MCP and verify RLS/tenant isolation.
3. Add the MCP execution service in this separate repository, initially with account/symbol/quote/position reads and order-preview validation only.
4. Add the order-changing MCP tools behind per-call approval, but keep their server-side feature flag off until Demo tests pass.
5. Verify the UI, authentication, system analysis, MT5 Demo read path, and order denial behavior. Do not enable Live trading without a separate explicit decision and review.

## Current state

- The standalone app and its own Vercel project already exist.
- The repository has a read-only `voom_status` tool, but it previously queried a legacy API URL and an unauthenticated `/api/mt5/status` route.
- The status tool update in this change switches to public Worker health endpoints only.
- No MT5 order execution endpoint is claimed to exist. No secrets, production environment variables, Vercel configuration, or deployments are changed by this plan.
