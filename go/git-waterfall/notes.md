### The command to build a graph

```
git -c log.showSignature=false log --max-count=301 --format="%H %P %at | %s"  --date-order --branches --tags --remotes HEAD
```
