import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as sass from 'node-sass-middleware';
import * as path from 'path';

export let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.use(sass({
    src: path.join(__dirname, '..', 'public', 'css'),
    dest: path.join(__dirname, '..', 'public', 'css'),
    outputStyle: 'compressed',
    prefix: '/css'
}));

app.use('/', async (req, res) => {
    res.render('index');
});

// catch 404 and forward to error handler
app.use(async (req, res, next) => {
    // const err = new Error('Not Found');
    res.end("Not found!")
});
