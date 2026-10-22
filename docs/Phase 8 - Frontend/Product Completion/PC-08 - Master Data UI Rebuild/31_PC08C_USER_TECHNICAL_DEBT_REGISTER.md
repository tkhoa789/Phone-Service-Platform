# PC-08C User Technical Debt Register

| ID | Domain | Issue | Mitigation Strategy | Priority |
|---|---|---|---|---|
| TD-08-03 | User | Client-side Pagination (`.slice()`) is utilized as the `userService.getAll()` API returns an unbounded `UserDto[]`. | Logic isolated. Must wait for API contract update to implement true Server-Side Pagination. | Low |
