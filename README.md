# Lab W9 GitOps: Observability + Canary + Ship Smartly

Repo: https://github.com/kokoreina/lab-cicd.git

Lab này triển khai một ứng dụng fullstack trên Minikube bằng GitOps với ArgoCD. Backend dùng NodeJS + Express, frontend dùng React + Vite và nginx. Toàn bộ workload ứng dụng, monitoring stack và Argo Rollouts đều được quản lý qua Git và ArgoCD app-of-apps.

## Kiến trúc

- GitHub là source of truth. Mọi thay đổi manifest đi qua commit, push, ArgoCD sync.
- `argocd/root.yaml` là app-of-apps. Root app trỏ tới `argocd/apps` và tạo các app con.
- `argocd/apps/fullstack.yaml` deploy namespace, frontend, backend Rollout, ServiceMonitor, PrometheusRule và AnalysisTemplate từ thư mục `k8s`.
- `argocd/apps/kube-prometheus-stack.yaml` cài Prometheus, Alertmanager và Grafana bằng Helm.
- `argocd/apps/argo-rollouts.yaml` cài Argo Rollouts bằng Helm.
- Prometheus scrape `/metrics` của backend qua ServiceMonitor.
- PrometheusRule tạo alert `BackendHighErrorRate` khi success rate của `/api/message` dưới 95%.
- Alertmanager gửi email khi alert fire.
- Argo Rollouts chạy canary cho backend và dùng AnalysisTemplate để tự abort bản lỗi.

## Build image local trong Minikube

Lab dùng image local, không dùng Docker Hub hay cloud registry.

```bash
minikube start -p w9
kubectl config use-context w9
eval $(minikube -p w9 docker-env)
docker build -t lab-cicd-backend:local apps/backend
docker build -t lab-cicd-frontend:local apps/frontend
```

Các manifest dùng `imagePullPolicy: Never`, nên Minikube sẽ chạy image local vừa build.

## Cấu hình email Alertmanager

Manifest Helm đã cấu hình Alertmanager dùng Gmail SMTP với placeholder `YOUR_EMAIL@gmail.com`. Không commit password thật vào Git.

Trước khi sync monitoring, tạo secret chứa Gmail App Password trong namespace `monitoring`:

```bash
kubectl create namespace monitoring
kubectl -n monitoring create secret generic alertmanager-gmail-auth \
  --from-literal=password='YOUR_GMAIL_APP_PASSWORD'
```

Sau đó sửa `argocd/apps/kube-prometheus-stack.yaml`, thay `YOUR_EMAIL@gmail.com` bằng email cá nhân của bạn rồi commit/push. Gmail cần bật 2FA và tạo App Password riêng.

## Sync bằng ArgoCD

Cài ArgoCD nếu cluster chưa có:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server
```

Apply root app:

```bash
kubectl apply -f argocd/root.yaml
kubectl get applications -n argocd
```

Root app sẽ tạo các app con:

- `fullstack`
- `kube-prometheus-stack`
- `argo-rollouts`

## Kiểm tra ứng dụng

```bash
kubectl get pods -n demo
kubectl get svc -n demo
kubectl get rollout -n demo
kubectl argo rollouts get rollout backend -n demo
```

Mở frontend:

```bash
minikube -p w9 service frontend -n demo --url
```

Frontend gọi `/api/message`; nginx trong frontend proxy `/api/` sang service `backend.demo.svc.cluster.local:3000`.

## Mở Prometheus, Grafana, Alertmanager

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
```

Kiểm tra Prometheus:

- Targets: backend phải `UP`.
- Query: `http_requests_total` phải có data sau khi tạo traffic.
- Alert: `BackendHighErrorRate` fire khi lỗi vượt ngưỡng.

## Tạo traffic

Trong một terminal, gọi frontend hoặc backend liên tục:

```bash
FRONTEND_URL=$(minikube -p w9 service frontend -n demo --url)
while true; do curl -s "$FRONTEND_URL/api/message"; echo; sleep 1; done
```

Trên PowerShell:

```powershell
$url = minikube -p w9 service frontend -n demo --url
while ($true) { Invoke-WebRequest "$url/api/message" -UseBasicParsing; Start-Sleep -Seconds 1 }
```

## Test SLO alert

Sửa `k8s/backend.yaml`:

```yaml
- name: ERROR_RATE
  value: "0.7"
```

Commit và push:

```bash
git add k8s/backend.yaml
git commit -m "Inject backend errors for SLO test"
git push
```

ArgoCD sync thay đổi, tạo traffic tới `/api/message`, rồi kiểm tra:

```bash
kubectl get prometheusrule -n demo
kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
```

Trong Alertmanager, alert `BackendHighErrorRate` sẽ firing và gửi email nếu secret Gmail đã cấu hình đúng.

## Test canary auto-abort

Đổi backend từ bản tốt sang bản lỗi trong `k8s/backend.yaml`:

```yaml
- name: VERSION
  value: "v2"
- name: ERROR_RATE
  value: "0.7"
```

Build lại image backend local nếu code thay đổi:

```bash
eval $(minikube -p w9 docker-env)
docker build -t lab-cicd-backend:local apps/backend
```

Commit và push:

```bash
git add k8s/backend.yaml
git commit -m "Canary backend v2 with injected errors"
git push
```

ArgoCD sync, Argo Rollouts bắt đầu canary:

```bash
kubectl argo rollouts get rollout backend -n demo --watch
```

Không promote hoặc abort bằng tay. AnalysisTemplate `backend-success-rate` query Prometheus; khi success rate dưới 95%, rollout tự abort về ReplicaSet ổn định trước đó.

## Rollback bằng git revert dưới 5 phút

Rollback phải đi qua Git:

```bash
git log --oneline
git revert <commit_sha>
git push
```

Theo dõi ArgoCD và rollout:

```bash
kubectl get applications -n argocd
kubectl argo rollouts get rollout backend -n demo --watch
```

Vì Git là source of truth, trạng thái cluster có thể reproduce lại từ repo.

## CI validate

GitHub Actions chạy khi push hoặc pull request có thay đổi trong `k8s/**`, `argocd/**` hoặc workflow. Workflow dùng:

```bash
kubeconform -strict -summary -ignore-missing-schemas k8s/ argocd/
```

Flag `-ignore-missing-schemas` giúp workflow không fail sai với CRD như Argo Rollouts, ServiceMonitor, PrometheusRule, AnalysisTemplate và ArgoCD Application. CI kiểm tra YAML trước khi ArgoCD sync vào cluster.
