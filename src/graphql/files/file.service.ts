import { Injectable } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { ConfigUtil } from '../../utils/config.util';
import { File } from './file.entity';
import { UploadFilesInput } from './inputs/upload-files.input';

@Injectable()
export class FileService {
  async uploadFiles(uploadFilesInput: UploadFilesInput): Promise<File[]> {
    const { files } = uploadFilesInput;
    const filesDir = ConfigUtil.get('files.dir');
    if (!existsSync(filesDir)) {
      mkdirSync(filesDir);
    }
    const getFiles = await this.getFiles(files);
    for (const file of getFiles) {
      await this.uploadFile(filesDir, file);
    }
    return getFiles;
  }

  async uploadFile(filesDir: string, file: File): Promise<any> {
    const { createReadStream, filename } = file;
    const stream = createReadStream();
    return new Promise(async (resolve, reject) => {
      stream
        .pipe(createWriteStream(`${filesDir}${filename}`))
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async getFiles(files: File[]): Promise<File[]> {
    const getFiles: File[] = [];
    for (const file of files) {
      const getFile = await file;
      const now = Date.now();
      getFile.filename = `${now}-${getFile.filename}`;
      getFiles.push(getFile);
    }
    return getFiles;
  }
}
