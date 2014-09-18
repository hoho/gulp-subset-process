# gulp-subset-process

Process a subset of the stream and put the result into place. When order
matters.


## Install

`npm install gulp-subset-process --save-dev`


## Description

Say, you need to do something with a subset of the stream and you need to put
the result into place of first occurrence of a file of your subset in the
stream (or last occurrence, or leave all occurrences in the same places).
That's what this plugin do.


## Examples

```js
var subsetProcess = require('gulp-subset-process');


gulp.task('some-task', function() {
    return gulp.src(['file1.js', 'file2.txt', 'file3.css', 'file4.txt', 'file5.png'])
        .pipe(subsetProcess('**/*.txt', function(src) { return src; }));
    // We did nothing with a subset, resulting stream is:
    // ['file1.js', 'file2.txt', 'file4.txt', 'file3.css', 'file5.png']
});


gulp.task('some-task2', function() {
    return gulp.src(['file1.js', 'file2.txt', 'file3.css', 'file4.txt', 'file5.png'])
        .pipe(subsetProcess(
            '**/*.txt',
            function(src) { return src; },
            {occurrence: 'last'} // Insert the result after last occurrence of `**/*.txt` in the stream.
        ));
    // ['file1.js', 'file3.css', 'file2.txt', 'file4.txt', 'file5.png']
});


gulp.task('some-task3', function() {
    return gulp.src(['file1.js', 'file2.txt', 'file3.css', 'file4.txt', 'file5.png'])
        .pipe(subsetProcess('**/*.txt', function(src) { return src.pipe(concat('all.txt')); }));
    // ['file1.js', 'all.txt', 'file3.css', 'file5.png']
});


gulp.task('some-task4', function() {
    return gulp.src(['file1.js', 'file2.txt', 'file3.css', 'file4.txt', 'file5.png'])
        .pipe(subsetProcess(
            '**/*.txt',
            function(src) { return src.pipe(template({env: 'piu'})); },
            {occurrence: 'keep'} // Keep positions in the stream.
        ));
    // ['file1.js', 'file2.txt', 'file3.css', 'file4.txt', 'file5.png']
});
```


## API

### subsetProcess(pattern, subtask, options)

Returns processed stream.

#### `pattern` (`String` or `Array`)

Accepts a string/array with globbing patterns which are run through
[multimatch](https://github.com/sindresorhus/multimatch).

#### `subtask` (`Function`)

Callback, first argument is a stream with a subset of initial stream matching
`pattern`.

#### `options` (`Object`)

Accepts [minimatch options](https://github.com/isaacs/minimatch#options) and
`occurrence` option with `'first'` (default), `'last'` and `'keep'` values to
insert the result in place of first occurrence of a file of your subset, in
place of last occurrence or keep all occurrences.
