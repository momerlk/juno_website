# Media Module

File upload, storage, and management via Google Cloud Storage. Supports images, documents, and video files.

Auth:
- Most endpoints require user auth via `Authorization: Bearer <token>`.
- `GET /api/v2/files/{objectName}` is public (no auth required).

---

## Shared Request/Response Schemas

### `File`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique file record ID |
| `bucket` | string | GCS bucket name |
| `object` | string | GCS object name (path within bucket) |
| `content_type` | string | MIME type |
| `size` | int | File size in bytes |
| `filename` | string | Original filename |
| `url` | string | Public URL to access the file |
| `uploaded_by` | string | User ID of uploader (empty if public) |
| `created_at` | ISO 8601 | Upload timestamp |
| `updated_at` | ISO 8601 | Last update timestamp |

### `UploadResponse`

| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | Uploaded file metadata |
| `message` | string | Human-readable message |
| `success` | bool | Whether upload succeeded |

### `DownloadResponse`

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Public/signed download URL |
| `message` | string | Human-readable message |
| `success` | bool | Whether URL generation succeeded |

### `PresignUploadRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | string | yes | Original filename |
| `content_type` | string | yes | MIME type |
| `file_size` | int | yes | File size in bytes |
| `folder` | string | yes | Folder/category: `products`, `avatars`, `documents`, `kyc` |

### `PresignUploadResponse`

| Field | Type | Description |
|-------|------|-------------|
| `upload_url` | string | Presigned URL for direct GCS upload |
| `object_name` | string | GCS object name that will be created |
| `public_url` | string | Public URL after upload |
| `expires_in` | int | Seconds until presigned URL expires (3600) |
| `headers` | object | Required headers for upload (e.g., `Content-Type`) |

### `ConfirmUploadRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `object_name` | string | yes | GCS object name that was uploaded |
| `metadata` | object | no | Additional metadata |

### `FileMetadata`

| Field | Type | Description |
|-------|------|-------------|
| `original_filename` | string | Original filename before upload |
| `alt_text` | string | Alt text for images |
| `tags` | string[] | Tags for categorization |

### `FileListResponse`

| Field | Type | Description |
|-------|------|-------------|
| `files` | `File[]` | List of files |
| `total` | int | Total number of files |
| `page` | int | Current page number |
| `limit` | int | Items per page |
| `has_next` | bool | Whether more pages exist |

---

## Allowed File Types

**Extensions:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.pdf`, `.doc`, `.docx`, `.mp4`, `.mov`

**Max file sizes:**
- Images: 10 MB
- Documents: 20 MB
- Videos: 100 MB

---

## Endpoints

### Upload File
`POST /api/v2/files/upload`

Uploads a file to Google Cloud Storage via multipart form.

**Content-Type:** `multipart/form-data`
**Form Field:** `file` (required)

**Response `201`**: [`UploadResponse`](#uploadresponse)

**Common errors**
- `400 INVALID_FORM` — Failed to parse multipart form
- `400 MISSING_FILE` — No file provided in 'file' form field
- `400 INVALID_FILE_TYPE` — File extension not allowed

---

### Get File URL
`GET /api/v2/files/{objectName}`

Retrieves the public download URL for an uploaded file.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `objectName` | string | GCS object name (URL-encoded) |

**Response `200`**: [`DownloadResponse`](#downloadresponse)

**Common errors**
- `400 MISSING_OBJECT` — Object name is required
- `404 NOT_FOUND` — File not found in storage

---

### Upload Images in Bulk
`POST /api/v2/files/upload/images`

Uploads up to 10 JPG, JPEG, PNG, GIF, or WEBP images in one request. Each image is limited to 10 MB.

**Content-Type:** `multipart/form-data`
**Form Field:** `images` (required, repeat once per image)

**Response `201`**: `BulkUploadResponse`, containing uploaded `files` in request order.

---

### Generate Presigned Upload URL
`POST /api/v2/files/presign`

Generates a presigned URL for direct client-to-GCS upload. The client then uploads directly to GCS using the presigned URL.

**Request Body**: [`PresignUploadRequest`](#presignuploadrequest)

**Response `200`**: [`PresignUploadResponse`](#presignuploadresponse)

**Common errors**
- `401 UNAUTHORIZED` — Authentication required
- `400 BAD_REQUEST` — Invalid content type, file size exceeds limit, or unsupported file extension

---

### Confirm Upload
`POST /api/v2/files/confirm`

Confirms a direct upload to GCS and creates a file record in the database. Used after uploading via a presigned URL.

**Request Body**: [`ConfirmUploadRequest`](#confirmuploadrequest)

**Response `200`**: [`UploadResponse`](#uploadresponse)

**Common errors**
- `401 UNAUTHORIZED` — Authentication required
- `400 INVALID_BODY` — Invalid request body
- `404 NOT_FOUND` — File not found in storage

---

### List Files
`GET /api/v2/files`

Retrieves a paginated list of files uploaded by the authenticated user.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `folder` | string | Filter by folder/category |
| `content_type` | string | Filter by MIME type |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Response `200`**: [`FileListResponse`](#filelistresponse)

**Error `401`** — Authentication required

---

### Delete File
`DELETE /api/v2/files/{objectName}`

Deletes a file from GCS and removes the database record. Only the file owner can delete.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `objectName` | string | GCS object name |

**Response `200`**: `{ "message": "File deleted successfully" }`

**Common errors**
- `401 UNAUTHORIZED` — Authentication required
- `403 FORBIDDEN` — You do not have permission to delete this file
- `404 NOT_FOUND` — File not found
