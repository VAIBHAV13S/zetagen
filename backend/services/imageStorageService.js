import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
    this.ensureUploadsDirectory();
  }

  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', this.uploadsDir);
    }
  }

  /**
   * Convert base64 image to file and return URL
   * @param {string} base64Data - Data URL (data:image/png;base64,...)
   * @param {string} assetId - Unique asset identifier
   * @returns {Promise<string>} - File URL
   */
  async saveBase64Image(base64Data, assetId) {
    try {
      // Parse the data URL
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 data URL format');
      }

      const mimeType = matches[1];
      const base64Content = matches[2];
      
      // Determine file extension
      const extension = this.getExtensionFromMimeType(mimeType);
      const filename = `${assetId}.${extension}`;
      const filepath = path.join(this.uploadsDir, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(filepath, buffer);

      console.log('💾 Saved base64 image to file:', filename);

      // Return the URL (relative to server)
      return `/uploads/images/${filename}`;

    } catch (error) {
      console.error('❌ Error saving base64 image:', error);
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type (image/png, image/jpeg, etc.)
   * @returns {string} - File extension
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };

    return mimeToExt[mimeType] || 'png';
  }

  /**
   * Delete image file
   * @param {string} filename - Filename to delete
   */
  async deleteImage(filename) {
    try {
      const filepath = path.join(this.uploadsDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('🗑️ Deleted image file:', filename);
      }
    } catch (error) {
      console.error('❌ Error deleting image:', error);
    }
  }

  /**
   * Check if image file exists
   * @param {string} filename - Filename to check
   * @returns {boolean} - Whether file exists
   */
  imageExists(filename) {
    const filepath = path.join(this.uploadsDir, filename);
    return fs.existsSync(filepath);
  }

  /**
   * Get image file stats
   * @param {string} filename - Filename to get stats for
   * @returns {object} - File stats
   */
  getImageStats(filename) {
    try {
      const filepath = path.join(this.uploadsDir, filename);
      const stats = fs.statSync(filepath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return { exists: false };
    }
  }
}

// Export singleton instance
const imageStorageService = new ImageStorageService();
export default imageStorageService;
