## Checking tickboxes on cross-references to closed PRs

If a PR references another inside a checkbox, this action aims to automatically close that checkbox, if the referenced PR is closed.

Example use:

```
   name: Cross-Ref
   on:
     pull_request:
       types: [closed]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checks checboxes that cross-referenced the closed/merged PR
           uses: egebeysel/check-cross-references@1.0.0
           with:
            # Token preferrably as secret, as this is visible if your repository is public.
             token: <YOUR_TOKEN>
          
```
