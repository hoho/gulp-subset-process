/*!
 * gulp-subset-process, https://github.com/hoho/gulp-subset-process
 * (c) 2014 Marat Abdullin, MIT license
 */

'use strict';

var through = require('through');
var multimatch = require('multimatch');
var PluginError = require('gulp-util').PluginError;


module.exports = function(pattern, subtask, options) {
    var filesBefore = [],
        filesBetween = [],
        filesAfter = [],
        files = [],
        filesKeep = [],
        hasMatch;

    pattern = typeof pattern === 'string' ? [pattern] : pattern;
    options = options || {};
    if (!options.occurrence) {
        options.occurrence = 'first';
    }

    if (!{first: true, last: true, keep: true}[options.occurrence]) {
        throw new PluginError('gulp-subset-process', 'Invalid `occurrence` option value');
    }

    if (!(pattern instanceof Array)) {
        throw new PluginError('gulp-subset-process', '`pattern` should be string or array');
    }

    if (typeof subtask !== 'function') {
        throw new PluginError('gulp-subset-process', '`subtask` should be function');
    }

    function bufferContents(file) {
        if (file.isNull()) { return; }
        if (file.isStream()) { return this.emit('error', new PluginError('gulp-subset-process',  'Streaming not supported')); }

        if (multimatch(file.relative, pattern, options).length > 0) {
            if (options.occurrence === 'keep') {
                filesKeep.push({
                    file: file,
                    match: true
                });
            } else {
                hasMatch = true;
                filesAfter = [];
                files.push(file);
            }
        } else {
            if (options.occurrence === 'keep') {
                filesKeep.push({
                    file: file,
                    match: false
                });
            } else {
                if (hasMatch) {
                    filesBetween.push(file);
                    filesAfter.push(file);
                } else {
                    filesBefore.push(file);
                }
            }
        }
    }

    function endStream() {
        try {
            var self = this;

            if (options.occurrence === 'keep') {
                (function processFile() {
                    var fileWrapper = filesKeep.shift();

                    if (fileWrapper) {
                        if (fileWrapper.match) {
                            var subtaskStream = through();
                            var ret = subtask(subtaskStream);

                            ret.on('data', function(file) {
                                self.emit('data', file);
                            });
                            ret.on('end', function() {
                                processFile();
                            });

                            subtaskStream.emit('data', fileWrapper.file);
                            subtaskStream.emit('end');
                        } else {
                            self.emit('data', fileWrapper.file);
                            processFile();
                        }
                    } else {
                        self.emit('end');
                    }
                })();
            } else {
                filesBetween.splice(filesBetween.length - filesAfter.length, filesAfter.length);

                filesBefore.forEach(function(file) {
                    self.emit('data', file);
                });

                if (options.occurrence === 'last') {
                    filesBetween.forEach(function(file) {
                        self.emit('data', file);
                    });
                }

                var subtaskStream = through();
                var ret = subtask(subtaskStream);
                ret.on('data', function(file) {
                    self.emit('data', file);
                });
                ret.on('end', function() {
                    if (options.occurrence === 'first') {
                        filesBetween.forEach(function(file) {
                            self.emit('data', file);
                        });
                    }
                    filesAfter.forEach(function(file) {
                        self.emit('data', file);
                    });
                    self.emit('end');
                });

                files.forEach(function(file) {
                    subtaskStream.emit('data', file);
                });

                subtaskStream.emit('end');
            }
        } catch(e) {
            return this.emit('error', new PluginError('gulp-subset-process', e.message));
        }
    }

    return through(bufferContents, endStream);
};
