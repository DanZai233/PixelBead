/**
 * 微信小程序 WebView 桥接工具
 * 用于 H5 页面与微信小程序之间的通信
 */

interface MessageData {
  type: string
  data?: any
  error?: string
}

interface WeChatMiniProgram {
  postMessage: (data: any) => void
  navigateTo: (options: any) => void
  navigateBack: (options?: any) => void
  switchTab: (options: any) => void
  reLaunch: (options: any) => void
  redirectTo: (options: any) => void
  getEnv: (callback: (res: { miniprogram: boolean }) => void) => void
  getAccountInfoSync: () => { miniProgram: { appId: string } }
}

declare global {
  interface Window {
    __wxjs_environment?: string
    wx?: {
      miniProgram: WeChatMiniProgram
    }
    WeixinJSBridge?: {
      invoke: (api: string, data: any, callback?: (res: any) => void) => void
    }
  }
}

class WeChatBridge {
  private static instance: WeChatBridge
  private wx: any
  private miniProgram: WeChatMiniProgram | null = null
  private isInMiniProgram: boolean = false

  private constructor() {
    this.detectEnvironment()
  }

  static getInstance(): WeChatBridge {
    if (!WeChatBridge.instance) {
      WeChatBridge.instance = new WeChatBridge()
    }
    return WeChatBridge.instance
  }

  /**
   * 检测运行环境
   */
  private detectEnvironment() {
    // 检查是否在微信小程序 WebView 中
    this.isInMiniProgram = window.__wxjs_environment === 'miniprogram'
    this.wx = window.wx
    this.miniProgram = this.wx?.miniProgram

    if (this.isInMiniProgram) {
      console.log('[WeChatBridge] 检测到小程序环境')
    } else {
      console.log('[WeChatBridge] 非小程序环境')
    }
  }

  /**
   * 判断是否在小程序中
   */
  isInMiniProgramEnv(): boolean {
    return this.isInMiniProgram
  }

  /**
   * 发送消息到小程序
   */
  private postMessage(message: MessageData): boolean {
    if (!this.isInMiniProgram || !this.miniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，无法发送消息')
      return false
    }

    try {
      this.miniProgram.postMessage({
        data: message
      })
      console.log('[WeChatBridge] 发送消息到小程序：', message)
      return true
    } catch (error) {
      console.error('[WeChatBridge] 发送消息失败：', error)
      return false
    }
  }

  /**
   * 保存图片到相册
   */
  async saveToAlbum(imageUrl: string): Promise<boolean> {
    if (!this.isInMiniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，使用 Web 端保存方式')
      // 返回 false 表示不处理，由调用方使用 Web 端保存方式
      return false
    }

    return this.postMessage({
      type: 'SAVE_TO_ALBUM',
      data: { url: imageUrl }
    })
  }

  /**
   * 分享
   */
  share(title: string, desc: string = ''): boolean {
    if (!this.isInMiniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，无法触发分享')
      return false
    }

    return this.postMessage({
      type: 'SHARE',
      data: { title, desc }
    })
  }

  /**
   * 获取用户信息
   */
  getUserInfo(): boolean {
    if (!this.isInMiniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，无法获取用户信息')
      return false
    }

    return this.postMessage({
      type: 'GET_USER_INFO',
      data: {}
    })
  }

  /**
   * 预览图片
   */
  previewImage(urls: string[], current: number | string = 0): boolean {
    if (!this.isInMiniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，使用 Web 端预览方式')
      return false
    }

    return this.postMessage({
      type: 'PREVIEW_IMAGE',
      data: { urls, current }
    })
  }

  /**
   * 跳转到小程序页面
   */
  navigateTo(url: string): boolean {
    if (!this.isInMiniProgram || !this.miniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，无法跳转页面')
      return false
    }

    try {
      this.miniProgram.navigateTo({ url })
      return true
    } catch (error) {
      console.error('[WeChatBridge] 跳转页面失败：', error)
      return false
    }
  }

  /**
   * 返回上一页
   */
  navigateBack(delta: number = 1): boolean {
    if (!this.isInMiniProgram || !this.miniProgram) {
      console.warn('[WeChatBridge] 不在小程序环境中，无法返回')
      return false
    }

    try {
      this.miniProgram.navigateBack({ delta })
      return true
    } catch (error) {
      console.error('[WeChatBridge] 返回失败：', error)
      return false
    }
  }

  /**
   * 获取小程序 AppID
   */
  getAppId(): string | null {
    if (!this.wx?.getAccountInfoSync) {
      return null
    }

    try {
      const info = this.wx.getAccountInfoSync()
      return info.miniProgram?.appId || null
    } catch (error) {
      console.error('[WeChatBridge] 获取 AppID 失败：', error)
      return null
    }
  }

  /**
   * 注册消息监听器（从小程序接收消息）
   */
  onMessage(callback: (message: MessageData) => void): () => void {
    if (!this.isInMiniProgram) {
      return () => {}
    }

    // H5 端直接接收小程序消息
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        callback(event.data)
      }
    }

    window.addEventListener('message', handler)

    // 返回清理函数
    return () => {
      window.removeEventListener('message', handler)
    }
  }
}

// 导出单例实例
const wechatBridge = WeChatBridge.getInstance()
export default wechatBridge
export { WeChatBridge }
export type { MessageData, WeChatMiniProgram }
