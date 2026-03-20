# agent-browser Workflow Patterns

Common automation patterns for headless browser tasks.

---

## Basic Page Inspection

Open a page, read its content via the accessibility tree, and close:

```bash
# Open the target page
agent-browser open https://example.com

# Get the accessibility tree to understand page structure
agent-browser snapshot

# (Read the snapshot output to extract information)

# Clean up
agent-browser close
```

**Use for:** Reading page content, checking page structure, verifying a page loads correctly.

---

## Form Filling and Submission

Navigate to a form, fill fields, submit, and verify the result:

```bash
# Open the page with the form
agent-browser open https://example.com/contact

# Snapshot to find form elements and their references
agent-browser snapshot

# Fill form fields using references from the snapshot
agent-browser fill @e3 "Jane Doe"
agent-browser fill @e4 "jane@example.com"
agent-browser fill @e5 "Hello, I have a question about your product."

# Select a dropdown value if present
agent-browser select @e6 "Support"

# Click the submit button
agent-browser click @e7

# Snapshot to verify submission result (success message, errors, etc.)
agent-browser snapshot

# Clean up
agent-browser close
```

**Key points:**
- Always snapshot before filling to get current element references
- Fill all fields before clicking submit
- Snapshot after submission to confirm success or catch validation errors

---

## Multi-Page Navigation

Click through links across multiple pages:

```bash
# Start at the landing page
agent-browser open https://example.com

# Snapshot to find navigation links
agent-browser snapshot

# Click a link to navigate to another page
agent-browser click @e4

# Snapshot the new page — references are now different
agent-browser snapshot

# Continue interacting with the new page
agent-browser click @e2

# Snapshot again after each navigation
agent-browser snapshot

# Clean up
agent-browser close
```

**Key points:**
- After every navigation (clicking a link that loads a new page), run `snapshot` again
- Element references from the previous page are no longer valid after navigation
- Each `snapshot` gives you a fresh set of references for the current page

---

## Authenticated Session

Access pages that require login by injecting session cookies:

```bash
# Set authentication cookies before opening the page
agent-browser cookie set "session_id=abc123def456; domain=.example.com"
agent-browser cookie set "csrf_token=xyz789; domain=.example.com"

# Open the authenticated page — cookies are sent with the request
agent-browser open https://example.com/dashboard

# Snapshot to verify you're logged in (should show user-specific content)
agent-browser snapshot

# Interact with authenticated content
agent-browser click @e5

agent-browser snapshot

# Clean up
agent-browser close
```

**When to use cookie injection vs. form login:**
- Use cookies when you already have valid session credentials (faster, more reliable)
- Use form filling when you need to go through the login flow (testing login, no existing cookies)

### Form-Based Login Alternative

```bash
agent-browser open https://example.com/login
agent-browser snapshot

# Fill login form
agent-browser fill @e2 "username"
agent-browser fill @e3 "password"
agent-browser click @e4

# Snapshot to verify login succeeded
agent-browser snapshot

# Now navigate to authenticated pages
agent-browser click @e6
agent-browser snapshot

agent-browser close
```

---

## Screenshot Capture

Take screenshots for visual verification at key points:

```bash
agent-browser open https://example.com

# Capture initial page state
agent-browser screenshot before.png

# Make some interactions
agent-browser snapshot
agent-browser click @e3

# Capture result
agent-browser screenshot after.png

agent-browser close
```

**Tips:**
- Screenshots are useful for visual verification when the accessibility tree doesn't capture layout/styling
- Use descriptive filenames to document multi-step processes
- Screenshots capture the visible viewport as PNG

---

## Error Recovery

When a page doesn't load or elements aren't found, reset and retry:

### Page Load Failure

```bash
# If open seems to hang or fail, close and retry
agent-browser close
agent-browser open https://example.com
agent-browser snapshot
```

### Stale Element References

```bash
# If click/fill fails with "element not found", the page has changed
# Re-snapshot to get fresh references
agent-browser snapshot

# Use the new references
agent-browser click @e5
```

### Unexpected Page State

```bash
# If snapshot shows unexpected content (redirect, error page, popup),
# take a screenshot for diagnosis
agent-browser screenshot debug.png

# Then decide: navigate back, close and reopen, or adjust approach
agent-browser close
agent-browser open https://example.com/intended-page
agent-browser snapshot
```

### General Recovery Pattern

When in doubt, the safest recovery is to close and start fresh:

```bash
agent-browser close
agent-browser open <url>
agent-browser snapshot
# Continue from here
```
