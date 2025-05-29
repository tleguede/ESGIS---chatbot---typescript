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
                    // Utiliser directement les variables d'environnement du fichier .env injecté précédemment
                    sh """
                        # Créer un nom de branche sécurisé pour les ressources AWS
                        BRANCH_SAFE=\$(echo "${BRANCH_NAME}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
                        
                        # Déployer avec les variables d'environnement du fichier .env
                        npm run deploy:ci -- --stack-name esgis-chatbot-\$BRANCH_SAFE --parameter-overrides EnvironmentName=\$BRANCH_SAFE
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
