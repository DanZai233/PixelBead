import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * 仅从系统相册选取图片（不唤起相机），避免 iOS 上 WebView 内「拍照」崩溃或未声明相机权限等问题。
 */
export async function pickImageDataUrlFromLibrary(): Promise<string | null> {
  const image = await Camera.getPhoto({
    quality: 92,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });
  return image.dataUrl ?? null;
}
