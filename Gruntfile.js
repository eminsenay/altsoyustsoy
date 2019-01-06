module.exports = function (grunt) {
    // load grunt tasks based on dependencies in package.json
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        //pkg: grunt.file.readJSON('package.json'),
    
        useminPrepare: {
            html: 'index.html',
            options: { 
                dest: 'docs'
            },
        },
        usemin: {
            html:['docs/index.html']
        },
        copy: {
            html: {
                src: 'index.html', dest: 'docs/index.html'
            },
            img: {
                expand: true,
                src: 'images/**',
                dest: 'docs/',
            },
            videos: {
                expand: true,
                src: 'videos/**',
                dest: 'docs/',
            },
        }
        // concat: {
        //     css: {
        //         files: { 'docs/css/style.css': 'css/**/*.css'}
        //     },
        //     js: {
        //         files: { 'docs/js/bundle.js': 'js/**/*.js' }
        //     }
        // },

        // cssmin: {
        //     target: {
        //         files: {
        //             'docs/css/style.min.css': 'docs/css/style.css'
        //         }
        //     }
        // },

        // uglify: {
        //     options: {
        //         banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        //     },
        //     build: {
        //         src: 'docs/js/bundle.js',
        //         dest: 'docs/js/bundle.min.js'
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
        'copy:videos',
        'copy:img',
		'copy:html',
		'useminPrepare',
		'concat',
		'uglify',
		'cssmin',
		'usemin'
    ]);
};