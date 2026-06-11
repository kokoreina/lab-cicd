# Lab GitOps CI/CD với ArgoCD

Repo: https://github.com/kokoreina/lab-cicd.git

Lab này triển khai ứng dụng `nginx:1.27` vào namespace `demo` bằng ArgoCD theo mô hình app-of-apps.

## Cấu trúc dự án

```text
lab-cicd/
├─ k8s/web.yaml
├─ argocd/apps/web.yaml
├─ argocd/root.yaml
├─ .github/workflows/validate.yaml
├─ README.md
└─ evidence.md
```

## 1. Tạo cluster minikube

```bash
minikube start
kubectl get nodes
```

## 2. Cài ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server
```

Lấy mật khẩu admin ban đầu:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Mở ArgoCD UI:

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Truy cập `https://localhost:8080`, đăng nhập user `admin` và mật khẩu vừa lấy.

## 3. Push code len GitHub

```bash
git init
git add .
git commit -m "Add ArgoCD GitOps lab"
git branch -M main
git remote add origin https://github.com/kokoreina/lab-cicd.git
git push -u origin main
```

Sau khi push, vào tab Actions trên GitHub để kiểm tra workflow validate YAML.

## 4. Apply root Application

```bash
kubectl apply -f argocd/root.yaml
```

Kiểm tra app:

```bash
kubectl -n argocd get applications
kubectl -n demo get pods
kubectl -n demo get svc
```

Trong ArgoCD UI, app `root` sẽ tạo app con `web`. App `web` cần hiển thị trạng thái `Synced` và `Healthy`.

## 5. Test self-heal

Sửa trực tiếp Deployment trên cluster để tạo drift:

```bash
kubectl -n demo scale deployment web --replicas=1
kubectl -n demo get deployment web
```

Vì app `web` bật `selfHeal: true`, ArgoCD sẽ tự động đưa Deployment về đúng khai báo trong Git:

```bash
kubectl -n demo get deployment web
```

Kết quả mong đợi: `READY` quay lại `2/2`.

## 6. Rollback

Vì Git là nguồn chuẩn, rollback được thực hiện bằng cách revert commit trên GitHub.

Ví dụ đổi image sang version khác:

```bash
kubectl -n demo get deployment web -o jsonpath="{.spec.template.spec.containers[0].image}"
```

Nếu đã commit thay đổi lỗi, revert commit:

```bash
git log --oneline
git revert <commit_sha>
git push origin main
```

ArgoCD sẽ sync về trạng thái từ commit revert. Kiểm tra lại:

```bash
kubectl -n argocd get applications
kubectl -n demo get deployment web
```
