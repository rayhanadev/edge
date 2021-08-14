import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import mime from 'mime';
const { getType: extMime } = mime;
import { getMimeType as streamMime } from 'stream-mime-type';
import { isBinaryFileSync } from 'isbinaryfile';

import sanitize from 'sanitize-filename';

import clear from 'clear';

import cors from 'cors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import express from 'express';
const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static('views'));

app.get('/', (req, res) => {
	res.status(200).sendFile('./views/index.html', { root: __dirname });
});

app.get('/dashboard', (req, res) => {
	res.status(200).sendFile('./views/dashboard.html', { root: __dirname });
});

app.post('/api/v1/upload', async (req, res) => {
	if(!['RayhanADev'].includes(req.headers['X-Replit-Username'])) {
		res.status(403).send({
			status: 403,
			message: 'You are not logged in.'
		});
	};

	try {
		if (!req.files || Object.keys(req.files).length === 0) {
			res.status(400).send({
				status: 400,
				message: 'No file uploaded.'
			});
		} else {
			let upload = req.files.upload;

			if(sanitize(upload.name) !== upload.name) {
				res.status(400).send({
					status: 400,
					message: 'Filename contains unsafe content'
				});
			};

			let folder = 
				req.body.folder &&
				['dev', 'personal', 'school'].includes(req.body.folder) &&
				['RayhanADev'].includes(req.headers['X-Replit-Username']) ?
					__dirname + `/files/${req.body.folder}/` + upload.name :
					__dirname + '/files/public/' + upload.name

			if(fs.existsSync(folder)) {
				res.status(409).send({
					status: 409,
					message: 'Resource already exists at given location.'
				})
			}

			upload.mv(folder);

			res.status(200).send({
				status: 200,
				message: 'File is uploaded.',
				data: {
					name: upload.name,
					mimetype: upload.mimetype,
					size: upload.size
				}
			});
		}
	} catch (err) {
		res.status(500).send(err);
	}
});

app.get('*', async (req, res) => {
	try {
		const localPath = './files' + req.path;
		if (fs.existsSync(localPath)) {
			const readStream = fs.createReadStream(localPath);
			const { stream, mime: streamMimeType } = await streamMime(readStream, {
				fileName: req.path.split('/').slice(-1)[0],
			});

			const extMimeType = extMime(localPath);
			const binaryFile = isBinaryFileSync(localPath);

			let finalMimeType = 'text/plain';

			if (streamMimeType === extMimeType) {
				finalMimeType = extMimeType;
			} else if (streamMimeType !== 'application/octet-stream') {
				finalMimeType = streamMimeType;
			} else if (binaryFile === true) {
				finalMimeType = 'application/octet-stream';
			} else {
				finalMimeType = 'text/plain';
			}

			res.status(200);
			res.header('Content-Type', finalMimeType);
			res.header('Content-Disposition', 'inline');
			res.header('Cache-Control', 'public, max-age=1, stale-while-revalidate=59');
			stream.pipe(res);
		} else {
			res.status(401).sendFile('./views/404.html', { root: __dirname });
		}
	} catch (error) {
		console.log(error);
		res.status(500).sendFile('./views/500.html', { root: __dirname });
	}
});

clear();
app.listen(3000, () => {
	console.log('Application running on Port:', 3000);
});