# Checklist evidence

Dùng file này để đánh dấu các ảnh cần chụp khi nộp lab.

- [ ] Ảnh repo GitHub `https://github.com/kokoreina/lab-cicd.git` có đầy đủ cấu trúc file.
- [ ] Ảnh GitHub Actions workflow validate chạy thành công.
- [ ] Ảnh ArgoCD UI hiển thị app `root` ở trạng thái `Synced` và `Healthy`.
- [ ] Ảnh ArgoCD UI hiển thị app `web` ở trạng thái `Synced` và `Healthy`.
- [ ] Ảnh kết quả `kubectl -n argocd get applications`.
- [ ] Ảnh kết quả `kubectl -n demo get pods` có 2 pod nginx đang `Running`.
- [ ] Ảnh kết quả `kubectl -n demo get svc` có Service `web` type `ClusterIP` port `80`.
- [ ] Ảnh test self-heal: scale Deployment xuống 1 replica.
- [ ] Ảnh sau self-heal: Deployment tự quay lại 2 replicas.
- [ ] Ảnh rollback: commit revert trên GitHub hoặc lịch sử Git.
- [ ] Ảnh rollback: ArgoCD sync thành công sau revert.
