# dsh-roleplay-rp-remote

Shared typed Remote transport for Roleplay browser features. The Host service owns the fixed Roleplay namespaces and domain-handler lifecycle; the browser service mounts the generated Typert contribution and exposes one `rpRemote.call()` seam to feature plugins.

The package deliberately carries no roleplay data or business rules. Domain plugins remain the source of truth and register their handlers only while their Cordis fibers are active.
