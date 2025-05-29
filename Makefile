# Makefile pour le projet ESGIS Chatbot (TypeScript)

# Par défaut, nous utilisons cette région
AWS_REGION ?= eu-west-3
AWS_PROFILE ?= "esgis_profile"

# Commandes de base
install:
	npm install

lint:
	npx eslint src/**/*.ts

test:
	npm test

build:
	npm run build
	sam build --use-container -t infrastructure/template.yaml

# Commandes de déploiement
deploy-local:
	sam local start-api

deploy:
	@echo "Déploiement vers " ${env}
	# Extraire l'environnement du nom de la branche
	sam deploy --resolve-s3 --template-file .aws-sam/build/template.yaml --stack-name multi-stack-${env} \
		--capabilities CAPABILITY_IAM --region ${AWS_REGION} --parameter-overrides EnvironmentName=${env} --no-fail-on-empty-changeset

# Test de l'endpoint
test-endpoint:
	@echo "Test de l'endpoint..."
	aws cloudformation describe-stacks --stack-name multi-stack-${env} --region ${AWS_REGION} \
		--query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text | xargs -I {} curl -X GET {}

# Commandes de développement
dev:
	npm run dev

# Commandes de nettoyage
clean:
	rm -rf node_modules
	rm -rf dist
	rm -rf .aws-sam

# Commande par défaut
.PHONY: install lint test build deploy-local deploy test-endpoint dev clean
