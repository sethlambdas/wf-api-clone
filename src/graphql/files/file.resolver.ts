import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { File } from './file.entity';
import { FileService } from './file.service';
import { UploadFilesInput } from './inputs/upload-files.input';

@Resolver()
export class FileResolver {
  constructor(private fileService: FileService) {}

  @Mutation(() => [File])
  async UploadFiles(@Args('uploadFilesInput') uploadFilesInput: UploadFilesInput): Promise<File[]> {
    return this.fileService.uploadFiles(uploadFilesInput);
  }
}
