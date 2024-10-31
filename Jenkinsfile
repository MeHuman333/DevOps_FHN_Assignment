pipeline {
    agent any

    environment {
        AWS_CREDENTIALS_ID = 'aws-access-key' // Jenkins credential ID for AWS IAM credentials
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-creds' // Jenkins credential ID for DockerHub
        ACCOUNT_ID = '038462748515' // Your AWS account ID
        REGION = 'us-east-1' // Your AWS region
        BACKEND_IMAGE = "mehooman/my-backend-app:${env.BUILD_ID}"
        FRONTEND_IMAGE = "mehooman/my-frontend-app:${env.BUILD_ID}"
        ECR_BACKEND_IMAGE = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mehooman/my-backend-app:${env.BUILD_ID}"
        ECR_FRONTEND_IMAGE = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mehooman/my-frontend-app:${env.BUILD_ID}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: 'main']], userRemoteConfigs: [[credentialsId: 'Git_creds', url: 'https://github.com/MeHuman333/DevOps_FHN_Assignment.git']]])
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
                withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                    script {
                        // Deploy both backend and frontend to staging on AWS ECS
                        sh "aws ecs update-service --cluster staging-cluster --service my-backend-app-staging --force-new-deployment"
                        sh "aws ecs update-service --cluster staging-cluster --service my-frontend-app-staging --force-new-deployment"
                    }
                }
            }
        }

        stage('Approval for Production') {
            steps {
                input message: "Deploy to production?"
            }
        }

        stage('Deploy to Production (Blue/Green)') {
            steps {
                withAWS(credentials: AWS_CREDENTIALS_ID, region: REGION) {
                    script {
                        // Deploy both backend and frontend to production with Blue/Green deployment strategy
                        sh "aws ecs update-service --cluster production-cluster --service my-backend-app-prod --force-new-deployment"
                        sh "aws ecs update-service --cluster production-cluster --service my-frontend-app-prod --force-new-deployment"
                    }
                }
            }
        }
    }
}
