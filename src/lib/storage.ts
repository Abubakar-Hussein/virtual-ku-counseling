/**
 * STORAGE ABSTRACTION LAYER
 * This module handles file uploads.
 * In a production environment, swap 'uploadImage' to use AWS S3, Cloudinary, or UploadThing.
 *
 * IMPORTANT: Currently returns base64 strings directly (no real upload).
 * Base64 images stored in MongoDB inflate document sizes by ~33%, making
 * every User query slower. Migrate to a CDN URL-based approach when possible.
 */

export async function uploadImage(base64: string): Promise<string> {
    if (!base64.startsWith('data:image')) {
        throw new Error('Invalid image format');
    }
    // TODO: Replace with real upload, e.g.:
    // const res = await uploadThing.upload(base64);
    // return res.url;
    return base64;
}

export function deleteImage(url: string) {
    // Logic to delete from cloud storage
    console.log(`Deleting image at: ${url}`);
}
