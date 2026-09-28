import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

function isUserCancelled(message: string): boolean {
  return /cancelled|canceled|取消/i.test(message);
}

function isUserDenied(message: string): boolean {
  return /denied|拒绝/i.test(message);
}

/**
 * 原生端单张选图：系统弹窗可选「相册」或「拍照」。
 * 使用 DataUrl：选中的图片既能在 WebView 中预览，也能作为图生图参考数据
 * 直接上传给服务端。iOS 的 webPath 只是本地 WebView 路径，无法被上游服务读取。
 */
export async function pickSingleImageNative(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      width: 1600,
      source: CameraSource.Prompt,
      correctOrientation: true,
      promptLabelHeader: '选择图片来源',
      promptLabelPhoto: '从相册选择',
      promptLabelPicture: '拍照',
      promptLabelCancel: '取消',
    });
    return photo.dataUrl ?? null;
  } catch (e: unknown) {
    const message =
      e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
    if (isUserCancelled(message)) return null;
    if (isUserDenied(message)) {
      throw new Error('请在系统设置中允许本应用访问相册与相机');
    }
    throw e;
  }
}
