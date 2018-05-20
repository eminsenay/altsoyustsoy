module.exports = function (grunt) {
    // load grunt tasks based on dependencies in package.json
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        //pkg: grunt.file.readJSON('package.json'),
    
        useminPrepare: {
            html: 'index.html',
            options: { 
                dest: 'deploy'
            },
        },
        usemin: {
            html:['deploy/index.html']
        },
        copy: {
            html: {
                src: 'index.html', dest: 'deploy/index.html'
            },
            img: {
                expand: true,
                src: 'images/**',
                dest: 'deploy/',
            },
        }
        // concat: {
        //     css: {
        //         files: { 'deploy/css/style.css': 'css/**/*.css'}
        //     },
        //     js: {
        //         files: { 'deploy/js/bundle.js': 'js/**/*.js' }
        //     }
        // },

        // cssmin: {
        //     target: {
        //         files: {
        //             'deploy/css/style.min.css': 'deploy/css/style.css'
        //         }
        //     }
        // },

        // uglify: {
        //     options: {
        //         banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        //     },
        //     build: {
        //         src: 'deploy/js/bundle.js',
        //         dest: 'deploy/js/bundle.min.js'
        //     }
        // }
    });
    
    // Next one would load plugins
    // grunt.loadNpmTasks('grunt-contrib-concat');
    // grunt.loadNpmTasks('grunt-contrib-cssmin');
    // grunt.loadNpmTasks('grunt-contrib-uglify-es');

    // Here is where we would define our task
    // grunt.registerTask('default', ['concat:css', 'cssmin', 'concat:js', 'uglify']);

    grunt.registerTask('default',[
        'copy:img',
		'copy:html',
		'useminPrepare',
		'concat',
		'uglify',
		'cssmin',
		'usemin'
    ]);
};