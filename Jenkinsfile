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
                    image 'amazon/aws-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    // Créer le bucket S3 s'il n'existe pas
                    sh """
                        # Configurer les informations d'identification AWS
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=eu-west-3
                        
                        # Créer le bucket S3 s'il n'existe pas
                        BUCKET_NAME="esgis-chatbot-artifacts-${BRANCH_NAME}"
                        if ! aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
                            echo "Création du bucket S3: $BUCKET_NAME"
                            aws s3 mb s3://$BUCKET_NAME
                        fi
                    """
                    
                    // Copier les fichiers du projet dans un répertoire temporaire
                    sh "cp -r . /tmp/project"
                    sh "cd /tmp/project && ls -la"
                    
                    echo "Construction du package CloudFormation..."
                    sh """
                        cd /tmp/project
                        # Configurer les informations d'identification AWS
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=eu-west-3
                        
                        # Empaqueter le template CloudFormation
                        BUCKET_NAME="esgis-chatbot-artifacts-${BRANCH_NAME}"
                        aws cloudformation package \
                            --template-file infrastructure/template.yaml \
                            --s3-bucket $BUCKET_NAME \
                            --output-template-file packaged.yaml
                    """
                    
                    // Copier les fichiers générés
                    sh "cp /tmp/project/packaged.yaml ."
                }
            }
        }

        stage('Deploy') {
            agent {
                docker {
                    image 'amazon/aws-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    echo "Déploiement du projet..."
                    sh """
                    # Configurer les informations d'identification AWS
                    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                    export AWS_DEFAULT_REGION=eu-west-3
                    
                    if [ -f "packaged.yaml" ]; then
                        # Déployer avec CloudFormation
                        echo "Déploiement avec CloudFormation..."
                        aws cloudformation deploy \
                            --template-file packaged.yaml \
                            --stack-name esgis-chatbot-${BRANCH_NAME} \
                            --parameter-overrides EnvironmentName=${BRANCH_NAME} \
                            --capabilities CAPABILITY_IAM
                    else
                        echo "Fichier packaged.yaml non trouvé, ignorant le déploiement"
                    fi
                    """
                }
            }
        }

        stage('Test endpoint'){
            agent {
                docker {
                    image 'amazon/aws-cli:latest'
                    args '--user root -e HOME=/tmp'
                }
            }
            steps {
                script {
                    echo "Test de l'endpoint déployé..."
                    sh """
                    # Configurer les informations d'identification AWS
                    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                    export AWS_DEFAULT_REGION=eu-west-3
                    
                    # Tester si le stack existe
                    if aws cloudformation describe-stacks --stack-name esgis-chatbot-${BRANCH_NAME} &>/dev/null; then
                        # Récupérer l'URL de l'endpoint
                        ENDPOINT_URL=\$(aws cloudformation describe-stacks --stack-name esgis-chatbot-${BRANCH_NAME} --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
                        if [ -n "\$ENDPOINT_URL" ]; then
                            echo "Testing endpoint: \$ENDPOINT_URL"
                            curl -s \$ENDPOINT_URL
                        else
                            echo "Endpoint URL not found in CloudFormation outputs"
                        fi
                    else
                        echo "Stack CloudFormation non trouvé, ignorant le test d'endpoint"
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
