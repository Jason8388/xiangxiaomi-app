/**
 * 创建适用于 FormData 的文件对象
 * 用于在 React Native 中上传文件到后端
 */

export interface FileObject {
  uri: string;
  type: string;
  name: string;
}

/**
 * 创建 FormData 文件对象
 * @param uri - 文件 URI（本地路径）
 * @param type - MIME 类型
 * @param name - 文件名
 * @returns 适用于 FormData 的文件对象
 */
export function createFormDataFile(
  uri: string,
  type: string,
  name: string
): FileObject {
  return {
    uri,
    type,
    name,
  };
}

/**
 * 从 expo-document-picker 结果创建文件对象
 * @param asset - expo-document-picker 返回的资源对象
 * @returns 文件对象
 */
export function createFileFromDocumentPicker(asset: any): FileObject {
  return createFormDataFile(
    asset.uri,
    asset.mimeType || 'application/octet-stream',
    asset.name || 'file'
  );
}

/**
 * 从 expo-image-picker 结果创建文件对象
 * @param asset - expo-image-picker 返回的资源对象
 * @returns 文件对象
 */
export function createFileFromImagePicker(asset: any): FileObject {
  return createFormDataFile(
    asset.uri,
    asset.type || 'image/jpeg',
    asset.fileName || 'image.jpg'
  );
}
