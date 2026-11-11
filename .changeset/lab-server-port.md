---
'@flamboyantengineer/ui-components': minor
---

The package ships the lab server as the `ui-components-labs` command, so a library built on this one serves its labs the same way (`ui-components-labs --dir labs --port 4183`). When its port is taken, the server moves to the next free port and says so; `--strict-port` keeps it to the asked port and exits instead.
