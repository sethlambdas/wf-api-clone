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
        stage('Run Test Containers') {
            steps {
                nodejs(nodeJSInstallationName: 'node-18') {
                    sh 'npm install -g pnpm'
                    sh 'pnpm run test:testcontainers'
                }
            }
        }
        stage('Terraform Init') {
            steps {
                dir('terraform') {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                        sh 'terraform init'
                    }
                }
            }
        }
        stage('Terraform Plan') {
            steps {
                dir('terraform') {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                        sh 'terraform plan'
                    }
                }
            }
        }
        stage('Terraform Approve') {
            steps {
                dir('terraform') {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                        sh 'terraform apply -auto-approve'
                    }
                }
            }
        }
        stage('Modify Yaml files') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        sh "/usr/local/aws-cli/v2/current/dist/aws ssm get-parameter --region ${AWS_REGION} --name \"/workflow-api/production/env\" --with-decryption | jq --raw-output .Parameter.Value > env.txt"
                        sh "export \$(cat env.txt | sed 's/#.*//g' | xargs -0) && cat config/production.yml | envsubst > config/temp.yml"
                        sh 'mv config/temp.yml config/production.yml'
                        sh 'cat config/production.yml'
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        // Build the Docker image
                        sh "docker build --build-arg AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} --build-arg AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} -f Dockerfile.pnpm -t ${IMAGE_NAME}:${APP_VERSION} ."
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
                    sh "/usr/local/aws-cli/v2/current/dist/aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                }
                // Push the Docker image to ECR
                sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${APP_VERSION}"
            }
        }
        // rerun terraform apply to replace ecs task definition image tag
        stage('Terraform Reapprove') {
            steps {
                dir('terraform') {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                        sh "terraform apply --auto-approve -var wf_api_image_tag=${APP_VERSION}"
                    }
                }
            }
        }

    }
}
