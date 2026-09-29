# demo-helm

Valatrix test project B: the same tiny Node 22 service, deployed as a **Helm chart on
Kubernetes**. GitHub Actions builds and pushes the image and the chart to GHCR; **ArgoCD**
syncs the cluster.

- `GET /health` → `{ status, version, commit }`
- `GET /items` → rows from Postgres

## Environments

| Environment | URL | ArgoCD app | Deployed by |
| --- | --- | --- | --- |
| staging | `http://demo-helm-staging.169.58.198.97.nip.io` | `demo-helm-staging` | `promote-staging`, on every push to `main` |
| prod | `http://demo-helm.169.58.198.97.nip.io` | `demo-helm-prod` | `promote-prod`, only on a manual run with `target=prod` |

## Pipeline (`.github/workflows/deploy.yml`)

`build → test → package-chart → promote-staging` on pushes to `main`. A manual run
(`workflow_dispatch`) takes an input `target`: `staging` (the default) redeploys staging only;
`prod` runs staging and then `promote-prod`.

- `package-chart` pushes `oci://ghcr.io/belyazidi56/charts/demo-helm:<chart version>`.
- `promote-staging` (environment `staging`) points the `demo-helm-staging` ArgoCD app at the
  new chart and image tag, syncs, and waits for the app to be Healthy.
- `promote-prod` (environment `prod`) does the same for `demo-helm-prod`. It runs only on a
  manual run with `target=prod`, and the `prod` environment is protected: the job also waits
  for an approval before it runs.

## Secrets

- Never inline. `DB_URL` and the GHCR pull secret come from the cluster's external secrets
  store (`ClusterSecretStore/valatrix-sandbox-store`) through `helm/templates/externalsecret.yaml`;
  `values-*.yaml` name the keys only.
- GitHub Actions secrets: `REGISTRY_TOKEN` (GHCR push), `ARGOCD_TOKEN`, and variable `ARGOCD_SERVER`.

## Releasing

Bump `version` in `package.json` (and the two `version` fields at the top of
`package-lock.json`) and merge to `main`: staging follows. The chart version in
`helm/Chart.yaml` changes only when the chart itself changes.

## Checking a deploy

`argocd app get demo-helm-<env>` must show **Synced** and **Healthy**, then
`curl -fsS <environment URL>/health` must report the new `version` and the merge commit's
short SHA as `commit`.

## Rollback

ArgoCD keeps the history of each app:

```
argocd app history demo-helm-staging        # find the previous ID
argocd app rollback demo-helm-staging <ID>
```

Equivalent with Helm directly: `helm history demo-helm -n demo-staging` then
`helm rollback demo-helm <revision> -n demo-staging`.
