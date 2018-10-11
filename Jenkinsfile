pipeline {
  agent any
  stages {
    /*
     * Assemble stage
     */
    stage('assemble') {
      steps {
        echo "Start the assembling on ${env.BRANCH_NAME}, Build id: ${currentBuild.displayName}"
        sh 'rake assemble'
      }
    }

    /*
     * Testing stage
     */
    stage('testing') {
      steps {
        echo "Start the test on ${env.BRANCH_NAME}, Build id: ${currentBuild.displayName}"
        sh 'rake test'
      }
      // Post Junit result
      //post {
      //  always {
      //    junit 'test/test-results.xml'
      //  }
      //}
    }

    /*
     * package stage
     */
    stage('package') {
      steps {
        script {
          sh 'rake package'
        }
        echo "Build duration: ${currentBuild.duration}"
      }
    }

    /*
     * tag stage
     */
    stage('tag') {
      steps {
        script {
          sh 'rake tag'
        }
        echo "Build duration: ${currentBuild.duration}"
      }
    }
  }
}