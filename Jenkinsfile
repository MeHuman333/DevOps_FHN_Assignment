pipeline {
    agent any

    environment {
        AWS_CREDENTIALS_ID = 'aws-access-key' // Jenkins credential ID for AWS IAM credentials
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-creds' // Jenkins credential ID for DockerHub
        ACCOUNT_ID = '038462748515' // AWS account ID
        REGION = 'us-east-1' // AWS region
        BUILD_ID = "${env.BUILD_ID}" // Jenkins build ID
        BACKEND_IMAGE = "mehooman/my-backend-app:${BUILD_ID}"
        FRONTEND_IMAGE = "mehooman/my-frontend-app:${BUILD_ID}"
        ECR_BACKEND_IMAGE = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mehooman/my-backend-app:${BUILD_ID}"
        ECR_FRONTEND_IMAGE = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mehooman/my-frontend-app:${BUILD_ID}"
    }

    stages {
            stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: 'main']], 
                          userRemoteConfigs: [[credentialsId: 'Git_creds', url: 'https://github.com/MeHuman333/DevOps_FHN_Assignment.git']]])
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Docker Image') {
                    steps {
                        dir('backend') {
                            script {
                                docker.build(BACKEND_IMAGE)
                            }
                        }
                    }
                }
                stage('Build Frontend Docker Image') {
                    steps {
                        dir('frontend') {
                            script {
                                docker.build(FRONTEND_IMAGE)
                            }
                        }
                    }
                }
            }
        }

        stage('Push Docker Images to AWS ECR') {
            steps {
                withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                    script {
                        // Login to ECR
                        sh "aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

                        // Push Backend Image
                        sh "docker tag ${BACKEND_IMAGE} ${ECR_BACKEND_IMAGE}"
                        sh "docker push ${ECR_BACKEND_IMAGE}"

                        // Push Frontend Image
                        sh "docker tag ${FRONTEND_IMAGE} ${ECR_FRONTEND_IMAGE}"
                        sh "docker push ${ECR_FRONTEND_IMAGE}"
                    }
                }
            }
        }

        stage('Deploy to Staging Environment') {
            steps {
                script {
                    try {
                        withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                            // Deploy both backend and frontend to staging on AWS ECS
                            sh "aws ecs update-service --cluster staging-cluster --service my-backend-app-staging --force-new-deployment"
                            sh "aws ecs update-service --cluster staging-cluster --service my-frontend-app-staging --force-new-deployment"
                        }
                        env.STAGING_SUCCESS = 'true'
                    } catch (Exception e) {
                        env.STAGING_SUCCESS = 'false'
                        error "Staging deployment failed."
                    }
                }
            }
        }

        stage('Deploy to Production (Blue/Green)') {
            when {
                expression { env.STAGING_SUCCESS == 'true' }
            }
            steps {
                withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                    script {
                        // Deploy both backend and frontend to production with Blue/Green deployment strategy
                        sh "aws ecs update-service --cluster Production-cluster --service my-backend-app-staging --force-new-deployment"
                        sh "aws ecs update-service --cluster Production-cluster --service my-frontend-app-staging --force-new-deployment"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                    script {
                        // Configure kubectl for EKS cluster and deploy images to Kubernetes using Helm
                        sh "aws eks update-kubeconfig --name my-chat-app-cluster --region ${REGION}"
                        sh """
                        helm upgrade --install backend ./DevOps_FHN_Assignment/backend/helm-chart --set image.repository=${ECR_BACKEND_IMAGE} --namespace chat-app
                        helm upgrade --install frontend ./DevOps_FHN_Assignment/frontend/helm-chart --set image.repository=${ECR_FRONTEND_IMAGE} --namespace chat-app
                        """
                    }
                }
            }
        }

        stage('Configure HPA for Kubernetes') {
            steps {
                script {
                    // Apply HPA configuration to enable scaling
                    sh "kubectl apply -f hpa.yaml --namespace chat-app"
                }
            }
        }

        stage('Setup Monitoring with Prometheus and Grafana') {
            steps {
                script {
                    // Install Prometheus and Grafana using Helm
                   // sh """
                   // helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                   // helm repo add grafana https://grafana.github.io/helm-charts
                   // helm repo update
                   // helm install prometheus prometheus-community/prometheus --namespace monitoring
                   // helm install grafana grafana/grafana --namespace monitoring
                   // """
                    
                    // Output Grafana access information
                    //echo "Grafana URL: http://<grafana-service-external-ip>:3000"
                    echo "Use admin/admin for initial Grafana login."
                }
            }
        }
    }
}
