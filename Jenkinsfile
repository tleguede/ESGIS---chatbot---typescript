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
                sh "npm run lint"
            }
        }

        stage('Tests') {
            steps {
                sh "npm test"
            }
        }

        stage('Build') {
            steps {
                sh "npm run build"
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

        stage('Test de l\'endpoint') {
            steps {
                script {
                    def branchSafe = BRANCH_NAME.toLowerCase().replaceAll(/[^a-z0-9]/, '-')
                    
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh """
                            export AWS_DEFAULT_REGION=${AWS_REGION}
                            
                            # Récupérer l'URL de l'API
                            ENDPOINT_URL=\$(aws cloudformation describe-stacks \\
                                --stack-name esgis-chatbot-${branchSafe} \\
                                --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \\
                                --output text)
                            
                            if [ -n "\$ENDPOINT_URL" ]; then
                                echo "Test de l'endpoint: \$ENDPOINT_URL"
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
    }
}
