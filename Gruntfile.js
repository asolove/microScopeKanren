module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-sweet.js');

  grunt.initConfig({
    sweetjs: {
      options: {
        modules: ['sparkler/macros', 'adt-simple/macros', 'lambda-chop/macros/fn'],
        readableNames: true
      },
      // Compiles to .js or .built.js files
      target: {
        src: 'src/*.sjs'
      }
    },
  });

  // Default task(s).
  grunt.registerTask('default', ['sweetjs']);

};