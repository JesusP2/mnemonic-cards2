import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../types';

function createS3Client(envs: Env['Variables']) {
  const client = new S3Client({
    region: 'auto',
    endpoint: envs.R2_ENDPOINT,
    credentials: {
      accessKeyId: envs.R2_ACCESS_KEY_ID,
      secretAccessKey: envs.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export async function uploadFile(
  buffer: Buffer,
  name: string,
  envs: Env['Variables'],
) {
  const client = createS3Client(envs);
  const command = new PutObjectCommand({
    Bucket: envs.R2_BUCKET_NAME,
    Key: name,
    Body: buffer,
  });

  await client.send(command);
}

export async function createPresignedUrl(key: string, envs: Env['Variables']) {
  const client = createS3Client(envs);
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: envs.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 * 7 },
  );
  return url;
}
