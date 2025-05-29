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
        AWS_CREDENTIALS = credentials('aws-credentials')
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

        stage('Déploiement') {
            steps {
                script {
                    // Créer un nom de branche sécurisé pour les ressources AWS
                    def branchSafe = BRANCH_NAME.toLowerCase().replaceAll(/[^a-z0-9]/, '-')
                    
                    withAWS(region: AWS_REGION, credentials: 'aws-credentials') {
                        // Créer le bucket S3 si nécessaire
                        sh """
                            BUCKET_NAME="esgis-chatbot-${branchSafe}"
                            aws s3api head-bucket --bucket \$BUCKET_NAME 2>/dev/null || aws s3 mb s3://\$BUCKET_NAME
                        """
                        
                        // Package et déploiement CloudFormation
                        sh """
                            # Package CloudFormation
                            aws cloudformation package \\
                                --template-file infrastructure/template.yaml \\
                                --s3-bucket esgis-chatbot-${branchSafe} \\
                                --output-template-file packaged.yaml
                            
                            # Déployer CloudFormation
                            aws cloudformation deploy \\
                                --template-file packaged.yaml \\
                                --stack-name esgis-chatbot-${branchSafe} \\
                                --parameter-overrides EnvironmentName=${branchSafe} \\
                                --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
                        """
                    }
                }
            }
        }

        stage('Test de l\'endpoint') {
            steps {
                script {
                    def branchSafe = BRANCH_NAME.toLowerCase().replaceAll(/[^a-z0-9]/, '-')
                    
                    withAWS(region: AWS_REGION, credentials: 'aws-credentials') {
                        sh """
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
