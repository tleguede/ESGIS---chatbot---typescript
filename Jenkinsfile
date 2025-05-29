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
                    withAWS(region: AWS_REGION, credentials: 'aws-credentials') {
                        sh "npm run deploy:ci -- --stack-name esgis-chatbot-${BRANCH_NAME} --parameter-overrides EnvironmentName=${BRANCH_NAME}"
                    }
                }
            }
        }

        stage('Test endpoint'){
            steps {
                script {
                    echo "Test de l'endpoint déployé..."
                    withAWS(region: AWS_REGION, credentials: 'aws-credentials') {
                        sh """
                            # Récupérer l'URL de l'API
                            ENDPOINT_URL=\$(aws cloudformation describe-stacks \\
                                --stack-name esgis-chatbot-${BRANCH_NAME} \\
                                --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \\
                                --output text)
                            
                            if [ -n "\$ENDPOINT_URL" ]; then
                                echo "Testing endpoint: \$ENDPOINT_URL"
                                curl -s \$ENDPOINT_URL
                            else
                                echo "Endpoint URL non trouvé dans les outputs CloudFormation"
                            fi
                        """
                    }
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
