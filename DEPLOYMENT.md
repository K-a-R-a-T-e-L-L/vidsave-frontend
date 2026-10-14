# VidSave frontend deployment

Полная инструкция общего проекта: [backend DEPLOYMENT.md](../vidsave-backend/DEPLOYMENT.md).

- Origin: https://github.com/K-a-R-a-T-e-L-L/vidsave-frontend.git; ветка main содержит текущий VidSave; локальная main отслеживает origin/main.
- Docker image: ghcr.io/k-a-r-a-t-e-l-l/vidsave-frontend:latest, container port3000.
- Domain: https://vidsave.karatell.ru; backend origin: https://api.vidsave.karatell.ru.
- Runtime environment: .env.production.example; настоящие значения — только в Dokploy.
- Вебхук владельца задан непосредственно в .github/scripts/deploy.mjs; GitHub Secret DOKPLOY_DEPLOY_WEBHOOK не требуется.
- Публикация образа и деплой запускаются автоматически после успешных проверок default branch. DEPLOY_ENABLED не требуется.
- Dokploy: Docker provider, Auto Deploy включён, private GHCR read:packages credentials, HTTPS, один frontend instance.
- Workflow .github/workflows/deploy.yml: PR/main/master checks; publish latest+SHA; затем POST на настроенный в скрипте вебхук. URL виден в публичном репозитории по прямому запросу владельца.
