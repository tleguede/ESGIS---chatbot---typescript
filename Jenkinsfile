pipeline {
    agent {
        docker {
            image 'node:18'
            args '--user root'
        }
    }

    options {
        ansiColor('xterm')
    }

    environment {
        BOT_NAME = 'esgis-chatbot'
        AWS_REGION = 'eu-west-3'
    }

    stages {
        stage('Installation des outils') {
            steps {
                script {
                    echo "Installation des outils nécessaires..."
                    sh """
                        # Installer AWS CLI
                        apt-get update
                        apt-get install -y python3-pip unzip curl
                        pip3 install awscli --upgrade
                        aws --version
                    """
                }
            }
        }

        stage('Installation des dépendances') {
            steps {
                script {
                    echo "Installation des dépendances..."
                    sh "npm install"
                }
            }
        }

        stage('Injection des variables d\'environnement'){
            steps {
                script{
                    withCredentials([file(credentialsId: 'tleguede-chatbot-env-file', variable: 'ENV_FILE')]) {
                        sh "cat $ENV_FILE >> .env"
                    }
                }
            }
        }

        stage('Linting') {
            steps {
                script {
                    echo "Vérification du code avec ESLint..."
                    sh "npm run lint"
                }
            }
        }

        stage('Tests Unitaires') {
            steps {
                script {
                    echo "Exécution des tests..."
                    sh "npm test"
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo "Compilation du projet TypeScript..."
                    sh "npm run build"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Déploiement du projet..."
                    // Utiliser directement les variables d'environnement du fichier .env injecté précédemment
                    sh """
                        # Créer un nom de branche sécurisé pour les ressources AWS
                        BRANCH_SAFE=\$(echo "${BRANCH_NAME}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
                        
                        # Créer un bucket S3 pour les artefacts de déploiement si nécessaire
                        BUCKET_NAME="esgis-chatbot-artifacts-\$BRANCH_SAFE"
                        aws s3api head-bucket --bucket \$BUCKET_NAME 2>/dev/null || aws s3 mb s3://\$BUCKET_NAME
                        
                        # Empaqueter le template CloudFormation
                        aws cloudformation package \
                            --template-file infrastructure/template.yaml \
                            --s3-bucket \$BUCKET_NAME \
                            --output-template-file packaged.yaml
                        
                        # Déployer avec CloudFormation
                        aws cloudformation deploy \
                            --template-file packaged.yaml \
                            --stack-name esgis-chatbot-\$BRANCH_SAFE \
                            --parameter-overrides EnvironmentName=\$BRANCH_SAFE \
                            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
                            --no-fail-on-empty-changeset
                    """
                }
            }
        }

        stage('Test endpoint'){
            steps {
                script {
                    echo "Test de l'endpoint déployé..."
                    // Utiliser directement les variables d'environnement du fichier .env injecté précédemment
                    sh """
                        # Créer un nom de branche sécurisé pour les ressources AWS
                        BRANCH_SAFE=\$(echo "${BRANCH_NAME}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
                        
                        # Récupérer l'URL de l'API
                        ENDPOINT_URL=\$(aws cloudformation describe-stacks \\
                            --stack-name esgis-chatbot-\$BRANCH_SAFE \\
                            --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \\
                            --output text 2>/dev/null || echo "")
                        
                        if [ -n "\$ENDPOINT_URL" ]; then
                            echo "Testing endpoint: \$ENDPOINT_URL"
                            curl -s \$ENDPOINT_URL
                        else
                            echo "Endpoint URL non trouvé dans les outputs CloudFormation ou stack non déployé"
                        fi
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Build réussi ! L'application a été déployée avec succès."
        }
        failure {
            echo "Build échoué. Veuillez vérifier les logs pour plus d'informations."
        }
        always {
            cleanWs()
        }
    }
}
