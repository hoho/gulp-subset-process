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
        hasMatch;

    pattern = typeof pattern === 'string' ? [pattern] : pattern;
    options = options || {};

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
            hasMatch = true;
            filesAfter = [];
            files.push(file);
        } else {
            if (hasMatch) {
                filesBetween.push(file);
                filesAfter.push(file);
            } else {
                filesBefore.push(file);
            }
        }
    }

    function endStream() {
        try {
            var self = this;

            filesBetween.splice(filesBetween.length - filesAfter.length, filesAfter.length);

            filesBefore.forEach(function(file) {
                self.emit('data', file);
            });

            if (options.afterLastOccurrence) {
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
                if (!options.afterLastOccurrence) {
                    filesBetween.forEach(function (file) {
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
        } catch(e) {
            return this.emit('error', new PluginError('gulp-subset-process', e.message));
        }
    }

    return through(bufferContents, endStream);
};