module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      base: {
        src: [
          'src/hqml.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*\n <%= pkg.name.toUpperCase() %>\n (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n License: <%= pkg.license %>\n*/\n'
      },
      base: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default - concat and minify hqml sources
  grunt.registerTask('default', ['concat:base', 'uglify:base']);

};
