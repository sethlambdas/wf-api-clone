pipeline {
    agent any
    
    environment {
        AWS_REGION="ap-southeast-2"
        CLUSTER_NAME="wf-cluster"
        ECR_REGISTRY = "917209780752.dkr.ecr.ap-southeast-2.amazonaws.com"
        IMAGE_NAME = "wf-api"
        BUILD_DATE = sh(returnStdout: true, script: 'date +%y.%m%d').trim()        
        APP_VERSION = "${BUILD_DATE}.${BUILD_ID}"
    }
    
    stages {
        stage('Terraform Init') {
            steps {
                dir('terraform') {
                    sh 'terraform init'
                }
            }
        }
        stage('Terraform Plan') {
            steps {
                dir('terraform') {
                    sh 'terraform plan'
                }
            }
        }
        stage('Terraform Approve') {
            steps {
                dir('terraform') {
                    sh 'terraform apply -auto-approve'
                }
            }
        }
        stage('Modify Yaml files') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        sh 'cat config/*.yml | envsubst > config/*.yml'
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        // Build the Docker image
                        sh "docker build --build-arg AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} --build-arg AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} -t ${IMAGE_NAME}:${APP_VERSION} ."
                    }
                }
            }
        }
        stage('Tag Docker Image') {
            steps {
                script {
                    // Tag the Docker image
                    sh "docker tag ${IMAGE_NAME}:${APP_VERSION} ${ECR_REGISTRY}/${IMAGE_NAME}:${APP_VERSION}"
                }
            }
        }
        stage('Push Docker Image to ECR') {
            steps {
                // Log in to ECR
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh "aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                }
                // Push the Docker image to ECR
                sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${APP_VERSION}"
            }
        }
        // rerun terraform apply to replace ecs task definition image tag
        stage('Terraform Reapprove') {
            steps {
                dir('terraform') {
                    sh "terraform apply --auto-approve -var wf_api_image_tag=${APP_VERSION}"
                }
            }
        }
        
    }
}