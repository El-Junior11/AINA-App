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
        stage('1. Configuration Backend') {
            steps {
                echo 'Installation des dépendances du Backend...'
                sh 'npm install --prefer-offline --no-audit --no-fund'
            }
        }

        stage('2. Build Frontend') {
            steps {
                echo 'Installation et Build du Frontend...'
                dir('frontend') {
                    sh 'npm install --prefer-offline --no-audit --no-fund'
                    sh 'NODE_OPTIONS="--max-old-space-size=2048" npm run build'
                }
            }
        }

stage('3. Build & Push Docker') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def imageFull = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                        def imageLatest = "${DOCKER_USER}/${IMAGE_NAME}:latest"
                        sh "docker build -f frontend/Dockerfile -t ${imageFull} -t ${imageLatest} ."
                        sh "echo \"$PASS\" | docker login -u \"$USER\" --password-stdin"          
                        sh "docker push ${imageFull}"
                        sh "docker push ${imageLatest}"
                    }
                }
            }
        }

        stage('4. Déploiement Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'k8s-kubeconfig', variable: 'KUBE_FILE')]) {
                    sh """
                        sed -i 's|${DOCKER_USER}/${IMAGE_NAME}:.*|${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}|g' k8s/deployment.yaml
                        kubectl --kubeconfig=${KUBE_FILE} apply -f k8s/deployment.yaml
                        kubectl --kubeconfig=${KUBE_FILE} rollout status deployment/${IMAGE_NAME}-deployment
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo 'Pipeline exécuté avec succès !'
        }
        failure {
            echo 'Le pipeline a échoué.'
        }
    }
}