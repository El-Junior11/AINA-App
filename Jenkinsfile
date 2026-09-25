pipeline {
    agent any

    tools {
        nodejs "NODEJS"
    }

    environment {
        DOCKER_USER = 'nantenaina11' 
        IMAGE_NAME  = 'aina-app'
        IMAGE_TAG   = "${BUILD_NUMBER}"
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

        stage('5. Build & Push Image Docker Hub') {
            steps {
                echo 'Création et envoi de l\'image Docker vers Docker Hub...'
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
                        sh "docker tag ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_USER}/${IMAGE_NAME}:latest"
                        
                        // Utilisation des guillemets doubles pour évaluer $PASS et $USER
                        sh "echo \"$PASS\" | docker login -u \"$USER\" --password-stdin"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('6. Déploiement sur Cluster Kubernetes') {
            steps {
                echo 'Déploiement sur le cluster Kubernetes...'
                script {
                    // Utilisation de withCredentials pour extraire le fichier kubeconfig
                    withCredentials([file(credentialsId: 'k8s-kubeconfig', variable: 'KUBE_FILE')]) {
                        sh "sed -i 's|${DOCKER_USER}/${IMAGE_NAME}:.*|${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}|g' k8s/deployment.yaml"
                        sh "kubectl --kubeconfig=${KUBE_FILE} apply -f k8s/deployment.yaml"
                        sh "kubectl --kubeconfig=${KUBE_FILE} rollout status deployment/${IMAGE_NAME}-deployment"
                    }
                }
            }
        }
    }

    post {
        always {
            sh "docker logout"
        }
        success {
            echo 'Pipeline exécuté avec succès ! Votre application est en ligne sur Kubernetes.'
        }
        failure {
            echo 'Échec du pipeline. Veuillez vérifier les logs ci-dessus.'
        }
    }
}