# VidSave frontend deployment

Полная инструкция общего проекта: [backend DEPLOYMENT.md](../vidsave-backend/DEPLOYMENT.md).

- Origin: https://github.com/K-a-R-a-T-e-L-L/vidsave-frontend.git; ветка main содержит текущий VidSave; локальная main отслеживает origin/main.
- Docker image: ghcr.io/k-a-r-a-t-e-l-l/vidsave-frontend:latest, container port3000.
- Domain: https://vidsave.karatell.ru; backend origin: https://api.vidsave.karatell.ru.
- Runtime environment: .env.production.example; настоящие значения — только в Dokploy.
- GitHub Environment production: secret DOKPLOY_DEPLOY_WEBHOOK (frontend URL, предоставленный владельцем).
- Repository variable DEPLOY_ENABLED=true включает публикацию/deploy только после успешных проверок default branch. До готовности оставить выключенной.
- Dokploy: Docker provider, Auto Deploy включён, private GHCR read:packages credentials, HTTPS, один frontend instance.
- Workflow .github/workflows/deploy.yml: PR/main/master checks; publish latest+SHA; webhook без раскрытия токена. Деплой сейчас не запускался.
