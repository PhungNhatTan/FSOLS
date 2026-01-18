declare module "mammoth/mammoth.browser" {
  export interface MammothImage {
    contentType: string;
    read(encoding: "base64"): Promise<string>;
  }

  export interface ConvertImageResult {
    src: string;
  }

  export interface MammothOptions {
    convertImage?: (image: MammothImage) => Promise<ConvertImageResult> | ConvertImageResult;
  }

  export interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: MammothOptions
  ): Promise<MammothResult>;

  export const images: {
    inline(
      fn: (image: MammothImage) => Promise<ConvertImageResult> | ConvertImageResult
    ): (image: MammothImage) => Promise<ConvertImageResult> | ConvertImageResult;
  };
}

declare module "pdfjs-dist/build/pdf.worker?url" {
  const workerUrl: string;
  export default workerUrl;
}
