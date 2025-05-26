import { join } from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { google } from 'googleapis';
import { EventEmitter } from 'events';

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = join(__dirname, '..', 'token.json');

class GoogleAuth extends EventEmitter {
  constructor() {
    super();
  }

  async authorize(credentials, port = 3000) {
    let token;
    const { client_secret, client_id } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      `http://localhost:${port}`
    );

    try {
      token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf-8'));
    } catch (e) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      this.emit('auth', authUrl);
      const code = await promisify(this.once).bind(this)('token');
      const { tokens } = await oAuth2Client.getToken(code);
      token = tokens;
      await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    }

    oAuth2Client.setCredentials(token);
    this.authClient = oAuth2Client;
  }

  token(code) {
    this.emit('token', code);
  }
}

class GoogleDrive extends GoogleAuth {
  constructor() {
    super();
    this.path = '/drive/api';
  }

  async getFolderID(path) {
    // Implementación pendiente
  }

  async infoFile(path) {
    // Implementación pendiente
  }

  async folderList(path) {
    // Implementación pendiente
  }

  async downloadFile(path) {
    // Implementación pendiente
  }

  async uploadFile(path) {
    // Implementación pendiente
  }
}

export { GoogleAuth, GoogleDrive };
