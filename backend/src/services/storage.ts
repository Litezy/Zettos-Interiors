import { randomUUID } from 'node:crypto'
import type { MultipartFile } from '@fastify/multipart'
import { v2 as cloudinary } from 'cloudinary'
import type { UploadApiOptions, UploadApiResponse } from 'cloudinary'
import { config } from '../config.js'
import { ApiError } from '../errors.js'

const fileExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function getCloudinaryClient() {
  if (
    !config.cloudinaryCloudName ||
    !config.cloudinaryApiKey ||
    !config.cloudinaryApiSecret
  ) {
    throw new ApiError(
      503,
      'STORAGE_NOT_CONFIGURED',
      'File storage is not configured on this server.',
    )
  }

  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  })

  return cloudinary
}

function matchesFileSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (contentType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
  }
  if (contentType === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    )
  }
  if (contentType === 'application/pdf') {
    return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
  }
  return false
}

function cleanFileName(fileName: string) {
  const name = fileName
    .split(/[\\/]/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f"]/g, '_')
    .slice(0, 180)
  return name || 'upload'
}

function resourceOptions(contentType: string) {
  const extension = fileExtensions[contentType]
  if (!extension) {
    throw new ApiError(400, 'UNSUPPORTED_FILE_TYPE', 'This file type is not supported.')
  }
  return {
    extension,
    resourceType: contentType === 'application/pdf' ? 'raw' as const : 'image' as const,
  }
}

async function uploadFile(
  file: MultipartFile,
  prefix: 'enquiry-pending' | 'project-pending' | 'service-pending',
  allowPdf: boolean,
) {
  const contentType = file.mimetype.toLowerCase()
  const { extension, resourceType } = resourceOptions(contentType)
  if (!allowPdf && resourceType !== 'image') {
    throw new ApiError(400, 'UNSUPPORTED_FILE_TYPE', 'Only image files are supported.')
  }

  const bytes = await file.toBuffer()
  if (file.file.truncated) {
    throw new ApiError(
      413,
      'FILE_TOO_LARGE',
      `Each file must be no larger than ${Math.floor(config.uploadMaxBytes / (1024 * 1024))} MB.`,
    )
  }
  if (bytes.length === 0 || !matchesFileSignature(contentType, bytes)) {
    throw new ApiError(
      400,
      'INVALID_FILE',
      'The uploaded file does not match its declared type.',
    )
  }
  if (bytes.length > config.uploadMaxBytes) {
    throw new ApiError(
      413,
      'FILE_TOO_LARGE',
      `Each file must be no larger than ${Math.floor(config.uploadMaxBytes / (1024 * 1024))} MB.`,
    )
  }

  const client = getCloudinaryClient()
  const fileKey = `${prefix}/${randomUUID()}`
  const deliveryType = prefix === 'enquiry-pending' ? 'authenticated' : 'upload'
  const options: UploadApiOptions = {
    public_id: fileKey,
    resource_type: resourceType,
    type: deliveryType,
    overwrite: false,
    unique_filename: false,
    filename_override: cleanFileName(file.filename),
    format: extension,
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(options, (error, response) => {
      if (error) {
        reject(error)
        return
      }
      if (!response) {
        reject(new Error('Cloudinary returned no upload result.'))
        return
      }
      resolve(response)
    })
    stream.end(bytes)
  })

  if (
    result.public_id !== fileKey ||
    result.bytes !== bytes.length ||
    result.resource_type !== resourceType ||
    result.type !== deliveryType
  ) {
    throw new ApiError(
      502,
      'STORAGE_UPLOAD_FAILED',
      'The uploaded file could not be verified by storage.',
    )
  }

  return {
    fileKey,
    fileName: cleanFileName(file.filename),
    contentType,
    sizeBytes: bytes.length,
    ...(deliveryType === 'upload'
      ? { publicUrl: publicAssetUrl(fileKey, contentType) }
      : {}),
  }
}

export async function uploadEnquiryFile(file: MultipartFile) {
  return uploadFile(file, 'enquiry-pending', true)
}

export async function uploadMediaFile(
  file: MultipartFile,
  kind: 'project' | 'service',
) {
  return uploadFile(
    file,
    kind === 'project' ? 'project-pending' : 'service-pending',
    false,
  )
}

async function verifyUploadedFile(
  input: {
    fileKey: string
    contentType: string
    sizeBytes: number
  },
  expectedPrefix: 'enquiry-pending' | 'project-pending' | 'service-pending',
) {
  if (!input.fileKey.startsWith(`${expectedPrefix}/`)) {
    throw new ApiError(
      400,
      'INVALID_ATTACHMENT',
      'An uploaded file does not belong to this upload request.',
    )
  }

  const { extension, resourceType } = resourceOptions(input.contentType)
  const deliveryType = expectedPrefix === 'enquiry-pending' ? 'authenticated' : 'upload'

  try {
    const result = await getCloudinaryClient().api.resource(input.fileKey, {
      resource_type: resourceType,
      type: deliveryType,
    })
    if (
      result.public_id !== input.fileKey ||
      result.bytes !== input.sizeBytes ||
      result.format !== extension ||
      result.resource_type !== resourceType ||
      result.type !== deliveryType
    ) {
      throw new ApiError(
        400,
        'INVALID_ATTACHMENT',
        'An uploaded file does not match its declared type or size.',
      )
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (
      typeof error === 'object' &&
      error !== null &&
      'http_code' in error &&
      error.http_code === 404
    ) {
      throw new ApiError(
        400,
        'UPLOAD_NOT_FOUND',
        'An attachment could not be verified. Please upload it again.',
      )
    }
    throw error
  }
}

export async function verifyUploadedEnquiryFile(input: {
  fileKey: string
  contentType: string
  sizeBytes: number
}) {
  return verifyUploadedFile(input, 'enquiry-pending')
}

export async function verifyUploadedProjectFile(input: {
  fileKey: string
  contentType: string
  sizeBytes: number
}) {
  return verifyUploadedFile(input, 'project-pending')
}

export async function verifyUploadedServiceFile(input: {
  fileKey: string
  contentType: string
  sizeBytes: number
}) {
  return verifyUploadedFile(input, 'service-pending')
}

export async function createPrivateDownload(fileKey: string, contentType: string) {
  const { extension, resourceType } = resourceOptions(contentType)
  const client = getCloudinaryClient()
  return client.utils.private_download_url(fileKey, extension, {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: true,
  })
}

export function publicAssetUrl(fileKey: string, contentType: string) {
  const { extension, resourceType } = resourceOptions(contentType)
  if (resourceType !== 'image') {
    throw new ApiError(400, 'INVALID_IMAGE', 'Only images can be used as public media.')
  }
  const client = getCloudinaryClient()
  return client.url(fileKey, {
    secure: true,
    resource_type: 'image',
    type: 'upload',
    format: extension,
  })
}
