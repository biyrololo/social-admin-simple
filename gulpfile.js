import gulp from 'gulp'
import pug from 'gulp-pug'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import cleanCss from 'gulp-clean-css'
import rename from 'gulp-rename'
import webpack from 'webpack'
import path from 'node:path'
import { rmSync, existsSync } from 'node:fs'

const sass = gulpSass(dartSass)

export function clean(done) {
    if (existsSync('dist/gulp')) {
        rmSync('dist/gulp', { recursive: true, force: true })
    }
    done()
}

export function templates() {
    return gulp.src('src/pages/*.pug')
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest('dist/gulp'))
}

export function styles() {
    return gulp.src('src/styles/main.scss')
        .pipe(sass.sync({
            includePaths: ['node_modules'],
            quietDeps: true,
            silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api']
        }).on('error', sass.logError))
        .pipe(cleanCss())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('dist/gulp/css'))
}

export function scripts(done) {
    webpack({
        mode: 'production',
        entry: './src/js/main.js',
        output: {
            path: path.resolve(process.cwd(), 'dist/gulp/js'),
            filename: 'bundle.min.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        }
    }, (err, stats) => {
        if (err || stats.hasErrors()) {
            return done(err || new Error('Webpack errors'))
        }
        done()
    })
}

export function assets() {
    return gulp.src('src/assets/**/*', { allowEmpty: true })
        .pipe(gulp.dest('dist/gulp/assets'))
}

export const build = gulp.series(clean, gulp.parallel(templates, styles, scripts, assets))
export default build
