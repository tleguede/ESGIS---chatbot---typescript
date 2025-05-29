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

        stage('Build et Packaging') {
            steps {
                script {
                    echo "Construction et packaging du projet..."
                    sh """
                        # Créer un nom de branche sécurisé pour les ressources
                        BRANCH_SAFE=\$(echo "${BRANCH_NAME}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
                        
                        # Compiler le projet TypeScript
                        npm run build
                        
                        # Créer un package de déploiement
                        echo "Création d'un package de déploiement..."
                        mkdir -p deployment-package
                        cp -r dist package.json package-lock.json node_modules infrastructure deployment-package/
                        
                        # Créer une archive pour le déploiement
                        tar -czf esgis-chatbot-\$BRANCH_SAFE.tar.gz -C deployment-package .
                        
                        echo "Package de déploiement créé: esgis-chatbot-\$BRANCH_SAFE.tar.gz"
                        echo "Ce package peut être déployé manuellement avec la commande:"
                        echo "sam deploy --guided --template-file infrastructure/template.yaml"
                    """
                    
                    // Archiver le package pour téléchargement depuis Jenkins
                    archiveArtifacts artifacts: '*.tar.gz', fingerprint: true
                }
            }
        }

        stage('Vérification du package'){
            steps {
                script {
                    echo "Vérification du package de déploiement..."
                    sh """
                        # Créer un nom de branche sécurisé pour les ressources
                        BRANCH_SAFE=\$(echo "${BRANCH_NAME}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
                        
                        # Vérifier que le package a été créé correctement
                        if [ -f "esgis-chatbot-\$BRANCH_SAFE.tar.gz" ]; then
                            echo "Package vérifié: esgis-chatbot-\$BRANCH_SAFE.tar.gz"
                            echo "Taille: \$(du -h esgis-chatbot-\$BRANCH_SAFE.tar.gz | cut -f1)"
                            
                            # Lister le contenu de l'archive pour vérification
                            echo "\nContenu du package:"
                            tar -tvf esgis-chatbot-\$BRANCH_SAFE.tar.gz | grep -E 'infrastructure|dist|package.json' | head -10
                            
                            echo "\nLe package est prêt à être déployé manuellement."
                            echo "Instructions de déploiement:"
                            echo "1. Télécharger le package depuis Jenkins"
                            echo "2. Extraire avec: tar -xzf esgis-chatbot-\$BRANCH_SAFE.tar.gz"
                            echo "3. Déployer avec: sam deploy --guided --template-file infrastructure/template.yaml"
                        else
                            echo "ERREUR: Le package n'a pas été créé correctement."
                            exit 1
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
