// storage.mjs — ALL S3 reads and writes go through this file.
// No other file should import the S3 client for data access.
//
// LOCAL DEV MODE: When LOCAL_DATA_DIR is set (by dev-server.mjs),
// data is stored as files on disk instead of S3. This lets you test
// without deploying to AWS. In Lambda, LOCAL_DATA_DIR is never set.

import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOCAL = process.env.LOCAL_DATA_DIR; // set only during local dev

let s3, BUCKET;

if (!LOCAL) {
  // Production: use S3
  const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  s3 = new S3Client({});
  BUCKET = process.env.DATA_BUCKET;
}

/**
 * Read a JSON file from the data bucket (or local directory).
 * Returns `fallback` if the key does not exist.
 */
export async function readJson(key, fallback = null) {
  if (LOCAL) {
    try {
      const text = await readFile(join(LOCAL, key), "utf-8");
      return JSON.parse(text);
    } catch (err) {
      if (err.code === "ENOENT") return fallback;
      throw err;
    }
  }

  // S3 path
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const text = await res.Body.transformToString("utf-8");
    return JSON.parse(text);
  } catch (err) {
    if (err.name === "NoSuchKey" || err.Code === "NoSuchKey") return fallback;
    throw err;
  }
}

/**
 * Write a JS object as a JSON file to the data bucket (or local directory).
 */
export async function writeJson(key, data) {
  if (LOCAL) {
    const filePath = join(LOCAL, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return;
  }

  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  }));
}

/**
 * Delete a single key from the data bucket (or local directory).
 */
export async function deleteKey(key) {
  if (LOCAL) {
    try {
      await unlink(join(LOCAL, key));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    return;
  }

  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
