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
                        # Installer AWS CLI via apt-get
                        apt-get update
                        apt-get install -y awscli
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
                        
                        # Compiler le projet TypeScript
                        npm run build
                        
                        # Créer un package de déploiement
                        mkdir -p deployment
                        cp -r dist package.json package-lock.json node_modules deployment/
                        
                        # Déployer avec les scripts npm existants
                        cd deployment
                        npm run deploy -- --stack-name esgis-chatbot-\$BRANCH_SAFE --parameter-overrides EnvironmentName=\$BRANCH_SAFE
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
                        echo "Récupération de l'URL de l'API depuis CloudFormation..."
                        STACK_NAME="esgis-chatbot-\$BRANCH_SAFE"
                        
                        # Vérifier si le stack existe
                        if aws cloudformation describe-stacks --stack-name \$STACK_NAME > /dev/null 2>&1; then
                            # Récupérer l'URL de l'API depuis les outputs CloudFormation
                            ENDPOINT_URL=\$(aws cloudformation describe-stacks \\
                                --stack-name \$STACK_NAME \\
                                --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \\
                                --output text)
                            
                            if [ -n "\$ENDPOINT_URL" ]; then
                                echo "Testing endpoint: \$ENDPOINT_URL"
                                curl -s \$ENDPOINT_URL
                                echo "\nTest de l'endpoint terminé."
                            else
                                echo "Aucune URL d'API trouvée dans les outputs du stack."
                            fi
                        else
                            echo "Le stack \$STACK_NAME n'existe pas ou n'est pas accessible."
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
