import express from 'express';
import { v4 as uuid } from 'uuid'
import cors from 'cors'
import { spawn } from 'child_process';
import { existsSync, readdirSync } from "fs"
import { fileURLToPath } from 'url'
import path from 'path'
import { unlink } from 'fs';
import multer from 'multer';


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json());
const port = 3000

const storage = multer.diskStorage(
    {
        destination: 'speakers/temp',
        filename: function (req, file, cb) {
            cb(null, file.originalname + ".wav");
        }
    }
);

const upload = multer({ storage: storage })

const speakers_list = (() => {
    return readdirSync(__dirname + "/speakers").filter(file => file.match(/\.(mp3|wav|ogg)$/))
})()

const subreddits = [
    "NoStupidQuestions",
    "TrueCrime",
    "Showerthoughts"
]

let busy = false

app.get('/info', (req, res) => {
    res.send({
        speakers: speakers_list,
        subreddits: subreddits,
    })
})

app.get('/busy', (req, res) => {
    // false is not doing anything
    // true is busy with a task
    res.send(busy)
})

app.post('/script', upload.single("audio_blob"), async (req, res) => {
    if (busy === true) return;

    busy = true;
    const output_path = `${__dirname}/output/${req.body.speaker.replace(/\.(mp3|wav|ogg)$/, "")}-${req.body.use_own_audio === "true" ? "d" : Date.now()}.wav`

    // spawn new child process to call the python script
    const args = [
        req.body.use_own_audio === "true" ? "temp/" + req.body.speaker : req.body.speaker,
        req.body.subreddit,
        output_path
    ];

    const python = spawn('python3', ['script.py', ...args]);

    // collect data from script
    python.stdout.on('data', function (data) {
        console.log('Pipe data from python script ...');
        console.log(data.toString());
    });

    // in close event we are sure that stream from child process is closed
    python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
        // send data to browser
        res.send(output_path)
        busy = false;
        if (existsSync("speakers/temp/" + req.body.speaker)) unlink("speakers/temp/" + req.body.speaker, (err) => {
            if (err) throw err;
            console.log('path/file.txt was deleted');
        });
    });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
