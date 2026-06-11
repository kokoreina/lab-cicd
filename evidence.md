# Checklist evidence W9

Dùng checklist này để chụp ảnh minh chứng khi demo với mentor.

- [ ] GitHub commit cho thấy thay đổi đi qua Git.
- [ ] GitHub repo có app fullstack, manifest observability và canary.
- [ ] GitHub Actions validate YAML màu xanh.
- [ ] ArgoCD app `root` Synced/Healthy.
- [ ] ArgoCD app `fullstack` Synced/Healthy.
- [ ] ArgoCD app `kube-prometheus-stack` Synced/Healthy.
- [ ] ArgoCD app `argo-rollouts` Synced/Healthy.
- [ ] Pods namespace `monitoring` Running.
- [ ] Pods namespace `argo-rollouts` Running.
- [ ] `kubectl get pods -n demo` có frontend và backend.
- [ ] `kubectl get rollout -n demo` có rollout `backend`.
- [ ] Frontend mở được bằng browser.
- [ ] Frontend gọi được backend message.
- [ ] Prometheus target backend ở trạng thái `UP`.
- [ ] Prometheus query `http_requests_total` có data.
- [ ] Alert `BackendHighErrorRate` firing khi inject lỗi.
- [ ] Email alert nhận được ở email cá nhân.
- [ ] Argo Rollouts backend canary bản lỗi tự abort.
- [ ] Git revert rollback hoàn tất dưới 5 phút.
- [ ] ArgoCD trở lại Synced/no drift sau rollback.
