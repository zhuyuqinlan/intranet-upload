import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UploadSession } from '../interfaces/upload-session.interface';

interface CreateSessionOptions {
  filename: string;
  fileHash: string;
  chunkSize: number;
  totalChunks: number;
  fileSize: number;
  folderPath: string;
  targetPath: string;
  existingChunks?: number[];
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, UploadSession>();

  create(data: CreateSessionOptions): UploadSession {
    const uploadId = uuidv4();
    const session: UploadSession = {
      ...data,
      uploadId,
      uploadedChunks: new Set(data.existingChunks || []),
      createdAt: new Date(),
    };
    this.sessions.set(uploadId, session);
    this.logger.log(`Created upload session: ${uploadId}`);
    return session;
  }

  get(uploadId: string): UploadSession | undefined {
    return this.sessions.get(uploadId);
  }

  addChunk(uploadId: string, chunkIndex: number): void {
    const session = this.sessions.get(uploadId);
    if (session) {
      session.uploadedChunks.add(chunkIndex);
    }
  }

  getUploadedChunks(uploadId: string): number[] {
    const session = this.sessions.get(uploadId);
    return session ? Array.from(session.uploadedChunks).sort() : [];
  }

  delete(uploadId: string): void {
    this.sessions.delete(uploadId);
    this.logger.log(`Deleted upload session: ${uploadId}`);
  }

  clear(): void {
    this.sessions.clear();
  }
}
