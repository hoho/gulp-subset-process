var subsetProcess = require('../');
var should = require('should');
var path = require('path');
var File = require('gulp-util').File;
var add = require('gulp-add');
var Buffer = require('buffer').Buffer;
var fs = require('fs');
var through = require('through');
require('mocha');


describe('gulp-subset-process', function() {
    describe('subsetProcess()', function() {
        testSubsetProcess(
            '**/*.txt',
            function(src) { return src; },
            undefined,
            [
                'file1.js', 'file: file1.js',
                'file2.txt', 'file: file2.txt',
                'file4.txt', 'file: file4.txt',
                'file3.css', 'file: file3.css',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        testSubsetProcess(
            ['file4.txt', 'file2.txt'],
            function(src) { return src; },
            {occurrence: 'last'},
            [
                'file1.js', 'file: file1.js',
                'file3.css', 'file: file3.css',
                'file2.txt', 'file: file2.txt',
                'file4.txt', 'file: file4.txt',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        testSubsetProcess(
            ['file4.txt', 'file2.txt'],
            function(src) { return src; },
            {occurrence: 'keep'},
            [
                'file1.js', 'file: file1.js',
                'file2.txt', 'file: file2.txt',
                'file3.css', 'file: file3.css',
                'file4.txt', 'file: file4.txt',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        testSubsetProcess(
            '**/*.txt',
            function(src) { return src.pipe(add('tmp.txt', 'file: tmp.txt')); },
            undefined,
            [
                'file1.js', 'file: file1.js',
                'file2.txt', 'file: file2.txt',
                'file4.txt', 'file: file4.txt',
                'tmp.txt', 'file: tmp.txt',
                'file3.css', 'file: file3.css',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        testSubsetProcess(
            '**/*.txt',
            function(src) { return src.pipe(add('tmp.txt', 'file: tmp.txt', true)); },
            {occurrence: 'last'},
            [
                'file1.js', 'file: file1.js',
                'file3.css', 'file: file3.css',
                'tmp.txt', 'file: tmp.txt',
                'file2.txt', 'file: file2.txt',
                'file4.txt', 'file: file4.txt',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        testSubsetProcess(
            '**/*.txt',
            function(src) { return src
                .pipe(add('tmp.txt', 'file: tmp.txt', true))
                .pipe(add('tmp2.txt', 'file: tmp2.txt'));
            },
            {occurrence: 'keep'},
            [
                'file1.js', 'file: file1.js',
                'tmp.txt', 'file: tmp.txt',
                'file2.txt', 'file: file2.txt',
                'tmp2.txt', 'file: tmp2.txt',
                'file3.css', 'file: file3.css',
                'tmp.txt', 'file: tmp.txt',
                'file4.txt', 'file: file4.txt',
                'tmp2.txt', 'file: tmp2.txt',
                'file5.jpg', 'file: file5.jpg'
            ]
        );

        function testSubsetProcess(pattern, subtask, options, results) {
            it('should process subset', function(done) {
                var stream = through();

                stream
                    .pipe(subsetProcess(pattern, subtask, options))
                    .on('data', function(file) {
                        var expectedFilename = results.shift(),
                            expectedHead = results.shift();

                        should.exist(file);
                        should.exist(file.relative);
                        should.exist(file.contents);
                        should.exist(expectedFilename);
                        should.exist(expectedHead);

                        var retFilename = path.resolve(file.path);
                        retFilename.should.equal(path.resolve(expectedFilename));
                        file.relative.should.equal(expectedFilename);

                        Buffer.isBuffer(file.contents).should.equal(true);
                        file.contents.toString().substring(0, expectedHead.length).should.equal(expectedHead);
                    })
                    .on('end', function() {
                        results.length.should.equal(0);
                        done();
                    });

                ['file1.js',
                 'file2.txt',
                 'file3.css',
                 'file4.txt',
                 'file5.jpg'].forEach(function(filename) {
                        filename = path.resolve(filename);
                        stream.write(new File({
                            path: filename,
                            contents: new Buffer('file: ' + path.basename(filename))
                        }));
                    });

                stream.end();
            });
        }
    });
});
