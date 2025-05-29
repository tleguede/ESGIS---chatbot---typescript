pipeline {
    agent any

    options {
        ansiColor('xterm')
    }

    environment {
        // Définir les variables d'environnement ici
        BOT_NAME = 'esgis-chatbot'
        // BOT_TOKEN = credentials('telegram-bot-token')
        NODE_VERSION = '18'
    }

    stages {
        stage('Initialisation') {
            steps {
                sh "echo Branch name ${BRANCH_NAME}"
                sh "npm install"
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
                    sh "npx eslint src/**/*.ts"
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
                    
                    echo "Construction du package AWS SAM..."
                    sh "sam build --use-container -t infrastructure/template.yaml"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Déploiement du projet..."
                    sh """
                    sam deploy --resolve-s3 --template-file .aws-sam/build/template.yaml \
                    --stack-name multi-stack-${BRANCH_NAME} \
                    --capabilities CAPABILITY_IAM \
                    --region eu-west-3 \
                    --parameter-overrides EnvironmentName=${BRANCH_NAME} \
                    --no-fail-on-empty-changeset
                    """
                }
            }
        }

        stage('Test endpoint'){
            steps {
                script {
                    echo "Test de l'endpoint..."
                    sh """
                    aws cloudformation describe-stacks --stack-name multi-stack-${BRANCH_NAME} \
                    --region eu-west-3 \
                    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
                    --output text | xargs -I {} curl -X GET {}
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
