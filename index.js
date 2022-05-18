import fs from 'fs';
import path from 'path';

import mime from 'mime';
const { getType: extMime } = mime;
import { getMimeType as streamMime } from 'stream-mime-type';
import { isBinaryFileSync } from 'isbinaryfile';
import sanitize from 'sanitize-filename';

import express from 'express';
const app = express();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WHITELISTED_USERS = ['RayhanADev'];

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());

app.get('/', (req, res) => {
	if (
		WHITELISTED_USERS.length > 0
			? WHITELISTED_USERS.includes(req.headers['x-replit-user-name'])
			: false
	) {
		return res.status(307).redirect('/~');
	}

	return res.status(200).sendFile('./views/index.html', { root: __dirname });
});

app.get('/~', (req, res) => {
	if (
		WHITELISTED_USERS.length > 0
			? !WHITELISTED_USERS.includes(req.headers['x-replit-user-name'])
			: false
	) {
		return res.status(307).redirect('/auth');
	}

	return res.status(200).sendFile('./views/dashboard.html', { root: __dirname });
});

app.get('/auth', (req, res) => {
	res.status(200).sendFile('./views/auth.html', { root: __dirname });
});

app.post('/api/v1/upload', async (req, res) => {
	if (
		WHITELISTED_USERS.length > 0
			? !WHITELISTED_USERS.includes(req.headers['x-replit-user-name'])
			: false
	) {
		return res.status(403).send({
			status: 403,
			message: 'You are not logged in.',
		});
	}

	try {
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send({
				status: 400,
				message: 'No file uploaded.',
			});
		} else {
			const name = req.body.name;
			const upload = req.files.upload;

			if (sanitize(name) !== name) {
				return res.status(400).send({
					status: 400,
					message: 'Filename contains unsafe content',
				});
			}

			const folder = __dirname + '/files/' + name + path.extname(upload.name);

			if (fs.existsSync(folder)) {
				return res.status(409).send({
					status: 409,
					message: 'Resource already exists at given location.',
				});
			}

			upload.mv(folder);

			return res.status(200).send({
				status: 200,
				message: 'File is uploaded.',
				data: {
					name: name,
					mimetype: upload.mimetype,
					size: upload.size,
					location: `${req.hostname}/f/${name + path.extname(upload.name)}`,
				},
			});
		}
	} catch (err) {
		return res.status(500).send(err);
	}
});

app.get('/f/:path', async (req, res) => {
	try {
		const localPath = './files/' + req.params.path;
		if (fs.existsSync(localPath)) {
			const readStream = fs.createReadStream(localPath);
			const { stream, mime: streamMimeType } = await streamMime(readStream, {
				fileName: req.params.path.split('/').slice(-1)[0],
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
			res.status(404).sendFile('./views/404.html', { root: __dirname });
		}
	} catch (error) {
		console.log(error);
		res.status(500).sendFile('./views/500.html', { root: __dirname });
	}
});

app.get('*', (req, res) => {
	res.status(404).sendFile('./views/404.html', { root: __dirname });
});

app.listen(3000, () => {
	console.log('Application running on Port:', 3000);
});
