pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    booleanParam(
      name: 'DEPLOY',
      defaultValue: true,
      description: 'Deploy ด้วย docker compose หลัง build สำเร็จ'
    )
    string(
      name: 'API_PORT',
      defaultValue: '3001',
      description: 'พอร์ตบน VPS ที่ map ไป container API'
    )
    string(
      name: 'CORS_ORIGIN',
      defaultValue: 'http://187.52.125.210:3000',
      description: 'Origin ของ frontend admin ที่อนุญาต (คั่นด้วย comma ได้)'
    )
    string(
      name: 'DATABASE_URL',
      defaultValue: 'postgres://postgres:root@host.docker.internal:5432/baan_laundry',
      description: 'Connection string ของ PostgreSQL (ใช้ host.docker.internal ถ้า DB อยู่บน host VPS)'
    )
    password(
      name: 'JWT_SECRET',
      defaultValue: '',
      description: 'JWT secret สำหรับเซ็น token (จำเป็นต้องใส่)'
    )
  }

  environment {
    COMPOSE_PROJECT_NAME = 'baan-laundry-api'
    IMAGE_NAME = 'baan-laundry-api'
    API_PORT = "${params.API_PORT}"
    CORS_ORIGIN = "${params.CORS_ORIGIN}"
    DATABASE_URL = "${params.DATABASE_URL}"
    JWT_SECRET = "${params.JWT_SECRET}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Validate') {
      steps {
        sh '''
          set -e
          if [ -z "${JWT_SECRET}" ]; then
            echo "JWT_SECRET is required"
            exit 1
          fi
          if [ -z "${DATABASE_URL}" ]; then
            echo "DATABASE_URL is required"
            exit 1
          fi
        '''
      }
    }

    stage('Build image') {
      steps {
        sh '''
          set -e
          export API_PORT="${API_PORT}"
          export CORS_ORIGIN="${CORS_ORIGIN}"
          export DATABASE_URL="${DATABASE_URL}"
          export JWT_SECRET="${JWT_SECRET}"
          docker compose build api
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { return params.DEPLOY == true }
      }
      steps {
        sh '''
          set -e
          export API_PORT="${API_PORT}"
          export CORS_ORIGIN="${CORS_ORIGIN}"
          export DATABASE_URL="${DATABASE_URL}"
          export JWT_SECRET="${JWT_SECRET}"
          docker compose up -d --remove-orphans api
        '''
      }
    }

    stage('Health check') {
      when {
        expression { return params.DEPLOY == true }
      }
      steps {
        sh '''
          set -e
          echo "Waiting for API on :${API_PORT}/laundry/api/health ..."
          for i in $(seq 1 30); do
            code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${API_PORT}/laundry/api/health" || true)"
            if echo "$code" | grep -Eq '^[123]'; then
              echo "API is healthy (HTTP $code)"
              exit 0
            fi
            if [ "$i" -eq 30 ]; then
              echo "API health check failed (HTTP $code)"
              docker compose ps || true
              docker compose logs --tail=80 api || true
              exit 1
            fi
            sleep 2
          done
        '''
      }
    }
  }

  post {
    success {
      echo "baan_laundry_api #${env.BUILD_NUMBER} succeeded → http://187.52.125.210:${params.API_PORT}/laundry/api/health"
    }
    failure {
      echo "baan_laundry_api #${env.BUILD_NUMBER} failed"
      sh 'docker compose ps || true'
    }
  }
}
