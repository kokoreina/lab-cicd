# Lab GitOps CI/CD Fullstack với ArgoCD

Repo: https://github.com/kokoreina/lab-cicd.git

Lab này triển khai một ứng dụng fullstack gồm React frontend và NodeJS backend lên Minikube bằng GitOps với ArgoCD. Image được build trực tiếp vào Docker daemon của Minikube, không dùng cloud registry và không dùng Docker Hub cho image ứng dụng.

## Cấu trúc dự án

```text
lab-cicd/
├─ apps/
│  ├─ frontend/
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ index.html
│  │  ├─ nginx.conf
│  │  └─ src/
│  │     ├─ App.jsx
│  │     ├─ main.jsx
│  │     └─ style.css
│  └─ backend/
│     ├─ Dockerfile
│     ├─ package.json
│     └─ src/
│        └─ server.js
├─ k8s/
│  ├─ namespace.yaml
│  ├─ backend.yaml
│  └─ frontend.yaml
├─ argocd/
│  ├─ root.yaml
│  └─ apps/
│     └─ fullstack.yaml
├─ .github/workflows/validate.yml
├─ README.md
└─ evidence.md
```

## 1. Tạo Minikube profile w9

```bash
minikube start -p w9
kubectl config use-context w9
kubectl get nodes
```

## 2. Build image local trong Minikube

Trỏ Docker CLI vào Docker daemon của Minikube:

```bash
minikube -p w9 docker-env --shell bash
eval $(minikube -p w9 docker-env)
```

Build hai image local:

```bash
docker build -t lab-cicd-backend:local apps/backend
docker build -t lab-cicd-frontend:local apps/frontend
```

Kubernetes manifest dùng `imagePullPolicy: Never`, nên kubelet sẽ dùng image local trong Minikube thay vì kéo từ registry.

## 3. Cài ArgoCD

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

Truy cập `https://localhost:8080`, đăng nhập bằng user `admin`.

## 4. Push code lên GitHub

```bash
git add .
git commit -m "Upgrade to fullstack GitOps demo"
git branch -M main
git remote add origin https://github.com/kokoreina/lab-cicd.git
git push -u origin main
```

Nếu remote đã tồn tại, dùng:

```bash
git remote set-url origin https://github.com/kokoreina/lab-cicd.git
git push -u origin main
```

GitHub Actions sẽ chạy workflow `.github/workflows/validate.yml` khi có thay đổi trong `k8s/**` và kiểm tra manifest bằng `kubeconform -strict -summary k8s/`.

## 5. Apply root Application

```bash
kubectl apply -f argocd/root.yaml
```

`argocd/root.yaml` là App of Apps. Root app không deploy trực tiếp workload, mà trỏ tới thư mục `argocd/apps`. Trong lab này, thư mục đó có app con `fullstack`, và app `fullstack` trỏ tới thư mục `k8s` để deploy namespace, backend và frontend.

Thứ tự sync được điều khiển bằng sync wave:

- `namespace.yaml`: wave `-1`
- `backend.yaml`: wave `1`
- `frontend.yaml`: wave `2`

## 6. Kiểm tra triển khai

```bash
kubectl get pods -n demo
kubectl get svc -n demo
kubectl -n argocd get applications
```

Lấy URL frontend:

```bash
minikube -p w9 service frontend -n demo --url
```

Mở URL được trả về trên browser. Trang frontend sẽ hiển thị title `GitOps Fullstack Demo` và gọi `/api/message`. Nginx trong frontend proxy request `/api/` sang service `backend.demo.svc.cluster.local:3000`.

## 7. Test self-heal

Tạo drift bằng cách scale frontend xuống 1 replica:

```bash
kubectl -n demo scale deployment frontend --replicas=1
kubectl -n demo get deployment frontend
```

Vì app `fullstack` bật `selfHeal: true`, ArgoCD sẽ đưa deployment quay lại 2 replicas theo Git:

```bash
kubectl -n demo get deployment frontend
```

Bạn cũng có thể thử sửa image hoặc service trực tiếp trên cluster, sau đó quan sát ArgoCD tự sync lại.

## 8. Test rollback

Rollback theo Git bằng cách revert commit lỗi:

```bash
git log --oneline
git revert <commit_sha>
git push origin main
```

Sau khi push revert, ArgoCD sẽ sync app `fullstack` về trạng thái từ commit mới nhất trên branch `main`.

Kiểm tra lại:

```bash
kubectl -n argocd get applications
kubectl get pods -n demo
minikube -p w9 service frontend -n demo --url
```
