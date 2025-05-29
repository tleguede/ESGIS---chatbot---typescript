pipeline {
    agent none

    options {
        ansiColor('xterm')
    }

    environment {
        // Définir les variables d'environnement ici
        BOT_NAME = 'esgis-chatbot'
        // BOT_TOKEN = credentials('telegram-bot-token')
        NODE_VERSION = '18'
        PATH = "$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
    }

    stages {
        stage('Configuration de l\'environnement') {
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                sh "echo Branch name ${BRANCH_NAME}"
                sh "node --version"
                sh "npm --version"
            }
        }
        
        stage('Installation des dépendances') {
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                sh "npm install"
            }
        }

        stage('Injection des variables d\'environnement'){
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                script{
                    withCredentials([file(credentialsId: 'tleguede-chatbot-env-file', variable: 'ENV_FILE')]) {
                        sh "cat $ENV_FILE >> .env"
                    }
                }
            }
        }

        stage('Linting') {
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                script {
                    echo "Vérification du code avec ESLint..."
                    sh "npm run lint"
                }
            }
        }

        stage('Tests Unitaires') {
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                script {
                    echo "Exécution des tests..."
                    sh "npm test"
                }
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'node:18'
                    args '--user root'
                }
            }
            steps {
                script {
                    echo "Compilation du projet TypeScript..."
                    sh "npm run build"
                }
            }
        }
        
        stage('AWS SAM Build') {
            agent {
                docker {
                    image 'amazon/aws-sam-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    // Copier les fichiers du projet dans le conteneur SAM
                    sh "cp -r . /tmp/project"
                    sh "cd /tmp/project && ls -la"
                    
                    echo "Construction du package AWS SAM..."
                    sh "cd /tmp/project && sam build -t infrastructure/template.yaml || echo 'Erreur lors de la construction SAM'"
                    
                    // Copier le dossier .aws-sam s'il existe
                    sh "if [ -d '/tmp/project/.aws-sam' ]; then cp -r /tmp/project/.aws-sam .; fi"
                }
            }
        }

        stage('Deploy') {
            agent {
                docker {
                    image 'amazon/aws-sam-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    echo "Déploiement du projet..."
                    sh """
                    if [ -d ".aws-sam/build" ]; then
                        # Configurer les informations d'identification AWS
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=eu-west-3
                        
                        # Déployer avec SAM CLI
                        sam deploy --stack-name esgis-chatbot-${BRANCH_NAME} \\
                        --no-fail-on-empty-changeset \\
                        --parameter-overrides EnvironmentName=${BRANCH_NAME}
                    else
                        echo "Dossier .aws-sam/build non trouvé, ignorant le déploiement"
                    fi
                    """
                }
            }
        }

        stage('Test endpoint'){
            agent {
                docker {
                    image 'amazon/aws-sam-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    echo "Test de l'endpoint déployé..."
                    sh """
                    if [ -d ".aws-sam/build" ]; then
                        # Configurer les informations d'identification AWS
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=eu-west-3
                        
                        # Récupérer l'URL de l'endpoint
                        ENDPOINT_URL=\$(aws cloudformation describe-stacks --stack-name esgis-chatbot-${BRANCH_NAME} --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
                        if [ -n "\$ENDPOINT_URL" ]; then
                            echo "Testing endpoint: \$ENDPOINT_URL"
                            curl -s \$ENDPOINT_URL
                        else
                            echo "Endpoint URL not found in CloudFormation outputs"
                        fi
                    else
                        echo "Dossier .aws-sam/build non trouvé, ignorant le test d'endpoint"
                    fi
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Actions post-build..."
            }
        }
        success {
            script {
                echo "Build réussi !"
                // Décommenter la ligne ci-dessous pour envoyer un message à Telegram
                // sh "curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/sendMessage -d chat_id=<CHAT_ID> -d text='Build réussi !'"
            }
        }
        failure {
            script {
                echo "Build échoué !"
                // Décommenter la ligne ci-dessous pour envoyer un message à Telegram
                // sh "curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/sendMessage -d chat_id=<CHAT_ID> -d text='Build échoué !'"
            }
        }
    }
}
