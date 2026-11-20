pipeline {
    agent any
    tools {
        nodejs "NODEJS"
    }
    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timestamps()
    }
    environment {
        DOCKER_USER = 'nantenaina11'
        IMAGE_NAME = 'aina-app'
        VPS_HOST = '15.235.242.72'
        VPS_DIR = '/opt/tsinjo-aina'
        K8S_NAMESPACE = 'tsinjo-test'
    }
    stages {
        stage('1. Checkout') {
            steps {
                deleteDir()
                checkout scm
                script {
                    env.IMAGE_TAG = "secure-${env.BUILD_NUMBER}"
                    env.IMAGE_REF = "${env.DOCKER_USER}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                }
                sh '''
                    set -eu
                    test -f .dockerignore
                    if git ls-files | grep -E '(^|/)\\.env($|\\.)' | grep -v '\\.env\\.example$'; then
                        echo "ERREUR : fichiers sensibles suivis par Git."
                        exit 1
                    fi
                    echo "Contrôle du code source réussi."
                '''
            }
        }
        stage('2. Configuration Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci --prefer-offline --no-audit --no-fund'
                }
            }
        }
        stage('3. Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci --prefer-offline --no-audit --no-fund'
                    sh 'NODE_OPTIONS="--max-old-space-size=2048" npm run build'
                }
            }
        }
        stage('4. Build, sécurité & Push Docker') {
            steps {
                sh '''
                    set -eu
                    docker build --tag "$IMAGE_REF" .
                    docker run --rm --network none --entrypoint sh "$IMAGE_REF" -c '
                        set -eu
                        files=$(find /app -type f -name ".env*")
                        if [ -n "$files" ]; then
                            echo "ERREUR : fichier .env détecté dans l image."
                            exit 1
                        fi
                        echo "Contrôle des fichiers .env réussi."
                    '
                '''
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_LOGIN',
                        passwordVariable: 'DOCKER_TOKEN')
                ]) {
                    sh '''
                        set +x
                        set -eu
                        export DOCKER_CONFIG=$(mktemp -d)
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT
                        printf '%s' "$DOCKER_TOKEN" | docker login \
                            --username "$DOCKER_LOGIN" --password-stdin
                        docker push "$IMAGE_REF"
                    '''
                }
                sh '''
                    set -eu
                    docker image inspect "$IMAGE_REF" \
                        --format='{{index .RepoDigests 0}}' > image-digest.txt
                    test -s image-digest.txt
                '''
                archiveArtifacts artifacts: 'image-digest.txt', fingerprint: true
            }
        }
        stage('5. Déploiement Kubernetes Test') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig-tsinjo-test',
                        variable: 'KUBECONFIG_FILE')
                ]) {
                    sh '''
                        set -eu
                        export KUBECONFIG="$KUBECONFIG_FILE"
                        IMAGE_DIGEST=$(cat image-digest.txt)
                        kubectl set image deployment/aina-app-test \
                            aina-app="$IMAGE_DIGEST" -n "$K8S_NAMESPACE"
                        kubectl rollout status deployment/aina-app-test \
                            -n "$K8S_NAMESPACE" --timeout=180s
                    '''
                }
            }
        }
        stage('6. Validation HTTP Kubernetes') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig-tsinjo-test',
                        variable: 'KUBECONFIG_FILE')
                ]) {
                    sh '''
                        set -eu
                        export KUBECONFIG="$KUBECONFIG_FILE"
                        TEST_POD="http-test-$BUILD_NUMBER"
                        cleanup() {
                            kubectl delete pod "$TEST_POD" \
                                -n "$K8S_NAMESPACE" --ignore-not-found=true \
                                --wait=false
                        }
                        trap cleanup EXIT
                        kubectl run "$TEST_POD" \
                            --namespace="$K8S_NAMESPACE" \
                            --image=curlimages/curl:latest \
                            --restart=Never --command -- sh -c \
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
                                exit 1
                            fi
                            sleep 5
                        done
                        echo "ERREUR : délai de validation dépassé."
                        exit 1
                    '''
                }
            }
        }
        stage('7. Déploiement sur VPS') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vps-ssh-credentials',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_CREDENTIAL_USER')
                ]) {
                    sh '''
                        set -eu
                        IMAGE_DIGEST=$(cat image-digest.txt)
                        ssh -i "$SSH_KEY" \
                            -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$SSH_CREDENTIAL_USER@$VPS_HOST" \
                            "set -eu;
                             cd $VPS_DIR;
                             test -f .env;
                             test -f docker-compose.yml;
                             export IMAGE_TAG=$IMAGE_TAG;
                             docker compose config -q;
                             docker compose pull backend;
                             test \\"\\$(docker image inspect $IMAGE_REF --format='{{.Id}}')\\" = \\"\\$(docker image inspect $IMAGE_DIGEST --format='{{.Id}}')\\" 2>/dev/null ||
                             {
                                docker pull $IMAGE_DIGEST;
                                test \\"\\$(docker image inspect $IMAGE_REF --format='{{.Id}}')\\" = \\"\\$(docker image inspect $IMAGE_DIGEST --format='{{.Id}}')\\";
                             };
                             docker compose up -d --no-deps --pull never backend"
                    '''
                }
            }
        }
        stage('8. Vérification Production') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vps-ssh-credentials',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_CREDENTIAL_USER')
                ]) {
                    sh '''
                        set -eu
                        ssh -i "$SSH_KEY" \
                            -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$SSH_CREDENTIAL_USER@$VPS_HOST" \
                            "set -eu;
                             test \\"\\$(docker inspect --format='{{.State.Status}}' tsinjo-aina-app)\\" = running;
                             test \\"\\$(docker inspect --format='{{.Image}}' tsinjo-aina-app)\\" = \\"\\$(docker image inspect --format='{{.Id}}' $IMAGE_REF)\\";
                             echo 'Version déployée : $IMAGE_TAG'"
                    '''
                }
                sh '''
                    set -eu
                    for attempt in $(seq 1 12); do
                        CODE=$(curl --silent --show-error --max-time 10 \
                            --output /dev/null --write-out "%{http_code}" \
                            https://ongtsinjoainafi.org/) || CODE=000
                        if [ "$CODE" = "200" ]; then
                            echo "Production validée : HTTP 200."
                            exit 0
                        fi
                        sleep 5
                    done
                    echo "ERREUR : application inaccessible."
                    exit 1
                '''
            }
        }
        stage('9. Publication version validée') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_LOGIN',
                        passwordVariable: 'DOCKER_TOKEN')
                ]) {
                    sh '''
                        set +x
                        set -eu
                        export DOCKER_CONFIG=$(mktemp -d)
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT
                        printf '%s' "$DOCKER_TOKEN" | docker login \
                            --username "$DOCKER_LOGIN" --password-stdin
                        docker tag "$IMAGE_REF" "$DOCKER_USER/$IMAGE_NAME:latest"
                        docker push "$DOCKER_USER/$IMAGE_NAME:latest"
                    '''
                }
            }
        }
    }
    post {
        success {
            echo "Déploiement réussi : ${env.IMAGE_TAG}"
        }
        failure {
            echo 'Échec du pipeline : consulter les logs.'
        }
        always {
            echo 'Fin du pipeline Jenkins.'
        }
    }
}