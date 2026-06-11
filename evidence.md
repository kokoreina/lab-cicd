# Checklist evidence

Dùng checklist này để chụp ảnh minh chứng khi nộp lab.

- [ ] GitHub repo có thư mục `apps/frontend` và `apps/backend`.
- [ ] Docker build backend thành công với image `lab-cicd-backend:local`.
- [ ] Docker build frontend thành công với image `lab-cicd-frontend:local`.
- [ ] ArgoCD app `root` ở trạng thái `Synced` và `Healthy`.
- [ ] ArgoCD app `fullstack` ở trạng thái `Synced` và `Healthy`.
- [ ] Kết quả `kubectl get pods -n demo` có pod `frontend` và `backend`.
- [ ] Kết quả `kubectl get svc -n demo` có service `frontend` NodePort `30080` và service `backend` ClusterIP.
- [ ] Browser mở được frontend qua `minikube -p w9 service frontend -n demo --url`.
- [ ] Frontend gọi được backend và hiển thị message `Hello from NodeJS backend via GitOps!`.
- [ ] GitHub Actions workflow validate màu xanh.
- [ ] Ảnh test self-heal: scale deployment xuống 1 replica.
- [ ] Ảnh sau self-heal: ArgoCD đưa deployment quay lại 2 replicas.
- [ ] Ảnh rollback: commit revert và ArgoCD sync thành công sau rollback.
