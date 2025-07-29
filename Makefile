# Makefile para gestión de Docker

.PHONY: help build build-dev up up-dev down down-dev logs logs-dev clean clean-dev restart restart-dev

# Variables
COMPOSE_FILE = docker-compose.yml
COMPOSE_DEV_FILE = docker-compose.dev.yml

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Comandos para producción
build: ## Construir imagen de producción
	docker-compose -f $(COMPOSE_FILE) build

up: ## Levantar servicios de producción
	docker-compose -f $(COMPOSE_FILE) up -d

down: ## Detener servicios de producción
	docker-compose -f $(COMPOSE_FILE) down

logs: ## Ver logs de producción
	docker-compose -f $(COMPOSE_FILE) logs -f

restart: ## Reiniciar servicios de producción
	docker-compose -f $(COMPOSE_FILE) restart

clean: ## Limpiar contenedores y volúmenes de producción
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans

# Comandos para desarrollo
build-dev: ## Construir imagen de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) build

up-dev: ## Levantar servicios de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) up -d

down-dev: ## Detener servicios de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) down

logs-dev: ## Ver logs de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) logs -f

restart-dev: ## Reiniciar servicios de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) restart

clean-dev: ## Limpiar contenedores y volúmenes de desarrollo
	docker-compose -f $(COMPOSE_DEV_FILE) down -v --remove-orphans

# Comandos de utilidad
status: ## Ver estado de todos los contenedores
	docker ps -a

shell-backend: ## Acceder al shell del backend
	docker exec -it timebox-backend sh

shell-backend-dev: ## Acceder al shell del backend de desarrollo
	docker exec -it timebox-backend-dev sh

shell-db: ## Acceder al shell de la base de datos
	docker exec -it timebox-db mysql -u root -proot timebox_tracking

shell-db-dev: ## Acceder al shell de la base de datos de desarrollo
	docker exec -it timebox-db-dev mysql -u root -proot timebox_tracking

# Comandos de limpieza completa
clean-all: ## Limpiar todo (contenedores, imágenes, volúmenes)
	docker system prune -a --volumes -f

# Comandos de backup
backup-db: ## Hacer backup de la base de datos
	docker exec timebox-db mysqldump -u root -proot timebox_tracking > backup_$(shell date +%Y%m%d_%H%M%S).sql

backup-db-dev: ## Hacer backup de la base de datos de desarrollo
	docker exec timebox-db-dev mysqldump -u root -proot timebox_tracking > backup_dev_$(shell date +%Y%m%d_%H%M%S).sql