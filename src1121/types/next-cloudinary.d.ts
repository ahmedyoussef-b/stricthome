export interface CldUploadEventCallback {
  info: {
    secure_url: string;
    resource_type: string;
    original_filename: string;
    format: string;
  };
}

export interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
  original_filename?: string;
}

export interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info?: CloudinaryUploadWidgetInfo | string | { public_id: string };
}
