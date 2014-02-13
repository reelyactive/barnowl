module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    //grunt-contrib-jshint
    jshint: {
      files: ['*.js', 'lib/**/*.js', '<%= mochaTest.files %>'],
      options: {
        jshintrc: 'script/.jshintrc-grunt',
      }
    },

    // grunt-mocha-test
    mochaTest: {
      files: ['test/**/*.js']
    },
    mochaTestConfig: {
      options: {
        reporter: 'spec',
        timeout: 2000,
        globals: ['should']
      }
    },

    // grunt-exec
    exec: {
      debugServer: {
        cmd: 'node ./node_modules/node-inspector/bin/inspector.js'
      },
      nodeDebug: {
        cmd: function(path) {
          return 'node --debug-brk ' + path;
        }
      }
    }
  });

  // Load grunt plugins and tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-exec');

  // Default tasks (running grunt w/o a specific task)
  grunt.registerTask('default', ['jshint', 'mochaTest']);

  // Aliases (running grunt w/ a specific task)
  grunt.registerTask('tests', ['mochaTest']);
  grunt.registerTask('debugServer', ['exec:debugServer']);
  grunt.registerTask('debug', 'A custom task to specify a file to debug.', function(path) {
    if (arguments.length === 0) {
      grunt.log.writeln('Cannot run debug task: must specify a file to debug.');
    } else {
      grunt.task.run('exec:nodeDebug:' + path);
    }
  });
};