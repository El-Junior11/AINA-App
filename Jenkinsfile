pipeline {
    agent any

    tools {
        nodejs "NODEJS"
    }

    stages {
        stage('0. Checkout') {
            steps {
                echo 'Récupération du code source depuis le dépôt Git...'
                checkout scm
            }
        }

        stage('1. Vérification Environnement') {
            steps {
                echo 'Vérification des versions de Node et npm...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('2. Installation Backend (Racine)') {
            steps {
                echo 'Installation des dépendances du backend...'
                sh 'npm install'
            }
        }

        stage('3. Installation & Build Frontend') {
            steps {
                echo 'Installation et compilation de l\'application React (dossier frontend)...'
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('4. Tests (Optionnel)') {
            steps {
                echo 'Exécution des tests unitaires...'
                echo 'Aucun test actif.'
            }
        }

        stage('5. Déploiement avec Docker Compose') {
            steps {
                echo 'Lancement du déploiement via Docker Compose!'
                sh 'docker-compose down'
                sh 'docker-compose up --build -d'
            }
        }
    }

    post {
        success {
            echo 'Pipeline exécuté avec succès ! Votre application est en ligne.'
        }
        failure {
            echo 'Échec du pipeline. Veuillez vérifier les logs ci-dessus.'
        }
    }
}