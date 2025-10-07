import { PixeldrainUploadResponse, PixeldrainFileInfo } from "@/types/Document";

class PixeldrainService {
  private apiUrl = "/api/upload-document";

  async uploadFile(
    file: File,
    fileName?: string
  ): Promise<PixeldrainUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (fileName) {
        formData.append("fileName", fileName);
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Invalid response from server");
      }

      return result.data;
    } catch (error) {
      console.error("Pixeldrain upload error:", error);
      throw error;
    }
  }

  async uploadFileWithName(
    file: File,
    fileName: string
  ): Promise<PixeldrainUploadResponse> {
    return this.uploadFile(file, fileName);
  }

  async getFileInfo(fileId: string): Promise<PixeldrainFileInfo> {
    try {
      const response = await fetch(
        `${this.apiUrl}?fileId=${encodeURIComponent(fileId)}&action=info`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get file info");
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Invalid response from server");
      }

      return result.data;
    } catch (error) {
      console.error("Pixeldrain get file info error:", error);
      throw error;
    }
  }

  async deleteFile(
    fileId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${this.apiUrl}?fileId=${encodeURIComponent(fileId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      const result = await response.json();
      return { success: result.success };
    } catch (error) {
      console.error("Pixeldrain delete error:", error);
      throw error;
    }
  }

  getFileUrl(fileId: string, download: boolean = false): string {
    const baseUrl = `https://pixeldrain.com/api/file/${fileId}`;
    return download ? `${baseUrl}?download` : baseUrl;
  }

  getThumbnailUrl(
    fileId: string,
    width: number = 128,
    height: number = 128
  ): string {
    return `https://pixeldrain.com/api/file/${fileId}/thumbnail?width=${width}&height=${height}`;
  }

  getPublicUrl(fileId: string): string {
    return `https://pixeldrain.com/u/${fileId}`;
  }
}

export const pixeldrainService = new PixeldrainService();
