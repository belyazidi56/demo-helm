# demo-helm

Valatrix test project B: the same tiny Node 22 service, deployed as a **Helm chart on
Kubernetes**. GitHub Actions builds and pushes the image and the chart to GHCR; **ArgoCD**
syncs the cluster.

- `GET /health` → `{ status, version, commit }`
- `GET /items` → rows from Postgres

## Pipeline (`.github/workflows/deploy.yml`)

`build → test → package-chart → promote-staging → promote-prod`, on pushes to `main`.

- `package-chart` pushes `oci://ghcr.io/belyazidi56/charts/demo-helm:<chart version>`.
- `promote-staging` (environment `staging`) points the `demo-helm-staging` ArgoCD app at the
  new chart and image tag, syncs, and waits for the app to be Healthy.
- `promote-prod` (environment `prod`) does the same for `demo-helm-prod`. The `prod`
  environment is protected: the job waits for an approval before it runs.

## Secrets

- Never inline. `DB_URL` and the GHCR pull secret come from the cluster's external secrets
  store (`ClusterSecretStore/valatrix-sandbox-store`) through `helm/templates/externalsecret.yaml`;
  `values-*.yaml` name the keys only.
- GitHub Actions secrets: `REGISTRY_TOKEN` (GHCR push), `ARGOCD_TOKEN`, and variable `ARGOCD_SERVER`.

## Checking a deploy

`argocd app get demo-helm-<env>` must show **Synced** and **Healthy**, then
`curl https://<ingress host>/health` must report the new `version` and `commit`.

## Rollback

ArgoCD keeps the history of each app:

```
argocd app history demo-helm-staging        # find the previous ID
argocd app rollback demo-helm-staging <ID>
```

Equivalent with Helm directly: `helm history demo-helm -n demo-staging` then
`helm rollback demo-helm <revision> -n demo-staging`.
