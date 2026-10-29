pipeline {
    agent any

    tools {
        nodejs "NODEJS"
    }

    environment {
        DOCKER_USER = 'nantenaina11'
        IMAGE_NAME  = 'aina-app'
        VPS_HOST    = '15.235.242.72'
        VPS_USER    = 'ubuntu'
        VPS_DIR     = '/opt/tsinjo-aina'
        K8S_NAMESPACE = 'tsinjo-test'
    }

    stages {
        stage('1. Checkout') {
            steps {
                echo 'Récupération du code source depuis GitHub...'
                checkout scm
            }
        }

        stage('2. Configuration Backend') {
            steps {
                echo 'Installation des dépendances du Backend...'
                sh 'npm install --prefer-offline --no-audit --no-fund'
            }
        }

        stage('3. Build Frontend') {
            steps {
                echo 'Construction du Frontend...'
                dir('frontend') {
                    sh 'npm install --prefer-offline --no-audit --no-fund'
                    sh 'NODE_OPTIONS="--max-old-space-size=2048" npm run build'
                }
            }
        }

        stage('4. Build & Push Docker') {
            steps {
                script {
                    def imageTag = "${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    def imageLatest = "${DOCKER_USER}/${IMAGE_NAME}:latest"

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKER_LOGIN',
                            passwordVariable: 'DOCKER_TOKEN'
                        )
                    ]) {
                        try {
                            sh '''
                                set -eu
                                echo "$DOCKER_TOKEN" | docker login \
                                    --username "$DOCKER_LOGIN" \
                                    --password-stdin
                            '''

                            sh """
                                docker build \
                                    --tag '${imageTag}' \
                                    --tag '${imageLatest}' \
                                    .
                            """

                            sh "docker push '${imageTag}'"
                            sh "docker push '${imageLatest}'"
                        } finally {
                            sh 'docker logout || true'
                        }
                    }
                }
            }
        }

        stage('5. Déploiement Kubernetes Test') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'kubeconfig-tsinjo-test',
                        variable: 'KUBECONFIG_FILE'
                    )
                ]) {
                    sh '''
                        set -eu
                        export KUBECONFIG="$KUBECONFIG_FILE"

                        kubectl set image \
                            deployment/aina-app-test \
                            aina-app="$DOCKER_USER/$IMAGE_NAME:$BUILD_NUMBER" \
                            -n "$K8S_NAMESPACE"

                        kubectl rollout status \
                            deployment/aina-app-test \
                            -n "$K8S_NAMESPACE" \
                            --timeout=180s
                    '''
                }
            }
        }

        stage('6. Validation HTTP Kubernetes') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'kubeconfig-tsinjo-test',
                        variable: 'KUBECONFIG_FILE'
                    )
                ]) {
                    sh '''
                        set -eu
                        export KUBECONFIG="$KUBECONFIG_FILE"

                        TEST_POD="http-test-$BUILD_NUMBER"

                        cleanup() {
                            kubectl delete pod "$TEST_POD" \
                                -n "$K8S_NAMESPACE" \
                                --ignore-not-found=true \
                                --wait=true
                        }

                        trap cleanup EXIT

                        kubectl run "$TEST_POD" \
                            --namespace="$K8S_NAMESPACE" \
                            --image=curlimages/curl:latest \
                            --restart=Never \
                            --command -- sh -c \
                            'code=$(curl --silent --show-error --max-time 15 \
                                --output /dev/null --write-out "%{http_code}" \
                                http://aina-app-test:5000/) || exit 1
                             echo "HTTP_STATUS=$code"
                             [ "$code" = "200" ]'

                        for attempt in $(seq 1 24); do
                            PHASE=$(kubectl get pod "$TEST_POD" \
                                -n "$K8S_NAMESPACE" \
                                -o jsonpath='{.status.phase}' 2>/dev/null || true)

                            if [ "$PHASE" = "Succeeded" ]; then
                                kubectl logs "$TEST_POD" -n "$K8S_NAMESPACE"
                                echo "Validation HTTP 200 réussie."
                                exit 0
                            fi

                            if [ "$PHASE" = "Failed" ]; then
                                kubectl logs "$TEST_POD" -n "$K8S_NAMESPACE" || true
                                echo "Échec de la validation HTTP."
                                exit 1
                            fi

                            sleep 5
                        done

                        kubectl logs "$TEST_POD" -n "$K8S_NAMESPACE" || true
                        echo "Délai dépassé pendant la validation HTTP."
                        exit 1
                    '''
                }
            }
        }

        stage('7. Déploiement sur VPS') {
            steps {
                script {
                    def imageTag = "${BUILD_NUMBER}"

                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: 'vps-ssh-credentials',
                            keyFileVariable: 'SSH_KEY',
                            usernameVariable: 'SSH_CREDENTIAL_USER'
                        )
                    ]) {
                        sh """
                            set -eu

                            ssh -i "\$SSH_KEY" \
                                -o BatchMode=yes \
                                -o StrictHostKeyChecking=yes \
                                "\$SSH_CREDENTIAL_USER@${VPS_HOST}" \
                                'cd ${VPS_DIR} &&
                                 test -f .env &&
                                 test -f docker-compose.yml &&
                                 docker compose config -q'
                        """

                        sh """
                            set -eu

                            ssh -i "\$SSH_KEY" \
                                -o BatchMode=yes \
                                -o StrictHostKeyChecking=yes \
                                "\$SSH_CREDENTIAL_USER@${VPS_HOST}" \
                                'cd ${VPS_DIR} &&
                                 export IMAGE_TAG=${imageTag} &&
                                 docker compose pull backend &&
                                 docker compose up -d --no-deps backend'
                        """
                    }
                }
            }
        }

        stage('8. Vérification du déploiement Production') {
            steps {
                script {
                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: 'vps-ssh-credentials',
                            keyFileVariable: 'SSH_KEY',
                            usernameVariable: 'SSH_CREDENTIAL_USER'
                        )
                    ]) {
                        sh """
                            set -eu

                            ssh -i "\$SSH_KEY" \
                                -o BatchMode=yes \
                                -o StrictHostKeyChecking=yes \
                                "\$SSH_CREDENTIAL_USER@${VPS_HOST}" \
                                'set -eu;
                                 cd ${VPS_DIR};
                                 docker compose ps backend;
                                 docker inspect --format="{{.State.Status}}" tsinjo-aina-app'
                        """
                    }

                    sh '''
                        set -eu
                        for attempt in $(seq 1 12); do
                            if curl --fail --silent --show-error \
                                --output /dev/null \
                                https://ongtsinjoainafi.org/; then
                                echo "Application accessible en HTTPS."
                                exit 0
                            fi

                            echo "Application en cours de démarrage..."
                            sleep 5
                        done

                        echo "ERREUR : application inaccessible après le déploiement."
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Déploiement TSINJO AINA terminé avec succès.'
        }

        failure {
            echo 'Échec du pipeline. Consultez les logs du stage en erreur.'
        }

        always {
            echo 'Fin du pipeline Jenkins.'
        }
    }
}