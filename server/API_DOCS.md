# ClipFind Backend API Documentation


Base URL: `https://clipfind-backend.onrender.com`
---

## 1. Upload Video File (Local Uploads)

Uploads a video file, starts the background AI identification process, and immediately returns a Job ID so the frontend doesn't hang.

* **Endpoint:** `/api/upload`
* **Method:** `POST`
* **Headers:** `Content-Type: multipart/form-data`
* **Body:**
* `video` (or `file`): The raw video file (max duration: 3 minutes).



**Success Response (202 Accepted):**
{
"message": "Processing started",
"jobId": "6a638874ac1a5b55b38d80a0"
}

**Error Responses:**

* `400 Bad Request`: File too large (over 3 mins) or missing file.
* `502 Bad Gateway`: Server failed to initiate processing.

---

## 2. Upload Video URL (Social Links)

Submits a public video URL, downloads it in the background, and triggers AI identification.

* **Endpoint:** `/api/upload-url`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body:**
* `videoUrl`: The URL string of the video (TikTok, YouTube, etc.).



**Payload Example:**
{
"videoUrl": "[https://www.tiktok.com/@username/video/123456789](https://www.google.com/search?q=https://www.tiktok.com/%2540username/video/123456789&utm_source=gemini)"
}

**Success Response (202 Accepted):**
{
"message": "URL processing started",
"jobId": "6ab8321876a3baea451ed508"
}

**Error Responses:**

* `400 Bad Request`: Missing or invalid URL.
* `502 Bad Gateway`: Server failed to initiate background download.

---

## 3. Check Job Status (Polling)

Check the status of the AI identification. **Frontend Logic:** You must poll this endpoint every 3 seconds using the `jobId` until the status changes to `"completed"` or `"failed"`.

* **Endpoint:** `/api/job/:id`
* **Method:** `GET`

**Success Response - Processing (200 OK):**
{
"_id": "6a638874ac1a5b55b38d80a0",
"status": "processing",
"result": null,
"createdAt": "2026-07-24T15:44:52.130Z"
}

**Success Response - Completed (200 OK):**
{
"_id": "6a638874ac1a5b55b38d80a0",
"status": "completed",
"result": {
"title": "Hotel Transylvania 3: Summer Vacation",
"year": "2018",
"director": "Genndy Tartakovsky",
"poster_path": "[https://image.tmdb.org/t/p/w500/lzE5BwGQea1nek7TPXUuC5AZ6rq.jpg](https://image.tmdb.org/t/p/w500/lzE5BwGQea1nek7TPXUuC5AZ6rq.jpg)",
"type": "movie",
"genre": ["animation", "comedy", "family"]
},
"createdAt": "2026-07-24T15:44:52.130Z"
}

**Success Response - Failed (200 OK):**
{
"_id": "6ab8321876a3baea451ed508",
"status": "failed",
"result": {
"error": "Could not extract video from the provided link."
},
"createdAt": "2026-07-24T15:44:52.130Z"
}

**Error Responses:**

* `404 Not Found`: Job ID does not exist in the database.
* `500 Internal Server Error`: Database retrieval failure.