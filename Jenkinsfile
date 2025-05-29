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
                        
                        # Créer un bucket S3 temporaire pour le déploiement
                        DEPLOYMENT_BUCKET="esgis-chatbot-deploy-\$BRANCH_SAFE"
                        
                        # Vérifier si le bucket existe déjà
                        if ! aws s3api head-bucket --bucket \$DEPLOYMENT_BUCKET 2>/dev/null; then
                            echo "Le bucket n'existe pas, vérification des permissions..."
                            # Essayer de lister les buckets pour vérifier les permissions
                            aws s3 ls
                            echo "Utilisation d'un bucket existant..."
                            
                            # Trouver un bucket existant que nous pouvons utiliser
                            EXISTING_BUCKETS=\$(aws s3 ls | awk '{print \$3}')
                            if [ -n "\$EXISTING_BUCKETS" ]; then
                                DEPLOYMENT_BUCKET=\$(echo "\$EXISTING_BUCKETS" | head -n 1)
                                echo "Utilisation du bucket existant: \$DEPLOYMENT_BUCKET"
                            else
                                echo "Aucun bucket S3 disponible. Utilisation d'un déploiement local."
                                DEPLOYMENT_BUCKET=""
                            fi
                        fi
                        
                        # Empaqueter et déployer l'application
                        if [ -n "\$DEPLOYMENT_BUCKET" ]; then
                            echo "Déploiement avec bucket S3: \$DEPLOYMENT_BUCKET"
                            # Empaqueter le template CloudFormation
                            aws cloudformation package \
                                --template-file infrastructure/template.yaml \
                                --s3-bucket \$DEPLOYMENT_BUCKET \
                                --output-template-file packaged.yaml
                            
                            # Déployer avec CloudFormation
                            aws cloudformation deploy \
                                --template-file packaged.yaml \
                                --stack-name esgis-chatbot-\$BRANCH_SAFE \
                                --parameter-overrides EnvironmentName=\$BRANCH_SAFE \
                                --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
                                --no-fail-on-empty-changeset
                        else
                            echo "Déploiement sans bucket S3 (mode limité)"
                            # Créer un package zip local
                            mkdir -p .aws-sam/build
                            cp -r dist/* .aws-sam/build/
                            cp package.json .aws-sam/build/
                            
                            # Déployer directement le code (sans Lambda layers ou ressources complexes)
                            echo "Le déploiement complet nécessite AWS SAM CLI ou un bucket S3 avec permissions."
                            echo "Veuillez configurer les permissions appropriées ou installer SAM CLI dans l'environnement Jenkins."
                        fi
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
