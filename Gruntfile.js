module.exports = function(grunt) {
  var header = '/*\n <%= pkg.name.toUpperCase() %> <%= pkg.version %>\n ' +
               '(c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n License: <%= pkg.license %>\n*/\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['src/**/*.js'],
      options: {
        '-W054': true,
      }
    },
    concat: {
      options: {
        banner: header
      },
      base: {
        src: [
          'src/browser.prefix',
          'src/util.js',
          'src/hqml.js',
          'src/enums/**/*.js',
          'src/objects/**/*.js',
          'src/browser.postfix'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: header
      },
      base: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      },
      parser: {
        src: 'build/qmlparser.tmp',
        dest: 'build/qmlparser.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default - concat and minify hqml sources
  grunt.registerTask('default', ['jshint', 'concat:base', 'uglify:base']);

  // Rebuild parser from pegjs grammer
  grunt.registerTask('parser', function() {
    var PEG = require("./lib/pegjs/lib/peg");
    var fs = require('fs');
    var parseSource = PEG.buildParser(fs.readFileSync('src/qml.pegjs', { encoding: 'utf8' }), {
      output: 'source'
    });
    fs.writeFileSync('build/qmlparser.tmp', 'QMLParser = ' + parseSource, { encoding: 'utf8' });
    grunt.task.run('uglify:parser', 'cleanparser');
  });
  grunt.registerTask('cleanparser', function() {
    require('fs').unlinkSync('build/qmlparser.tmp');
  });
};
