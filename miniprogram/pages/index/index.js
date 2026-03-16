Page({
  data: {
    webSrc: 'https://pindou.danzaii.cn'
  },

  onLoad(options) {
    console.log('页面加载', options)

    // 可以从 URL 参数获取自定义源
    if (options.src) {
      this.setData({
        webSrc: decodeURIComponent(options.src)
      })
    }
  },

  onReady() {
    console.log('页面渲染完成')
  },

  onShow() {
    console.log('页面显示')
  },

  onHide() {
    console.log('页面隐藏')
  },

  onUnload() {
    console.log('页面卸载')
  },

  /**
   * 处理来自 H5 的消息
   */
  handleMessage(e) {
    console.log('收到 H5 消息：', e.detail.data)

    const messages = e.detail.data
    if (!messages || messages.length === 0) return

    const message = messages[messages.length - 1]
    const { type, data } = message

    switch (type) {
      case 'SAVE_TO_ALBUM':
        this.saveToAlbum(data.url)
        break

      case 'SHARE':
        this.triggerShare(data.title, data.desc)
        break

      case 'GET_USER_INFO':
        this.getUserInfo()
        break

      case 'PREVIEW_IMAGE':
        this.previewImage(data.urls, data.current)
        break

      default:
        console.warn('未知消息类型：', type)
    }
  },

  /**
   * 保存图片到相册
   */
  async saveToAlbum(imageUrl) {
    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    try {
      // 如果是 base64，需要先转换为临时文件
      if (imageUrl.startsWith('data:')) {
        const filePath = await this.base64ToTempFile(imageUrl)
        await wx.saveImageToPhotosAlbum({ filePath })
      } else {
        // 如果是网络地址，先下载
        const downloadRes = await wx.downloadFile({ url: imageUrl })
        await wx.saveImageToPhotosAlbum({ filePath: downloadRes.tempFilePath })
      }

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()

      if (error.errMsg && error.errMsg.includes('auth deny')) {
        // 用户拒绝了权限
        wx.showModal({
          title: '提示',
          content: '您已拒绝保存到相册的权限，请在设置中开启',
          confirmText: '去设置',
          success(res) {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
        console.error('保存失败：', error)
      }
    }
  },

  /**
   * 将 base64 转换为临时文件
   */
  base64ToTempFile(base64) {
    return new Promise((resolve, reject) => {
      const [, format, body] = /data:image\/(\w+);base64,(.*)/.exec(base64) || []
      if (!format || !body) {
        reject(new Error('无效的 base64 格式'))
        return
      }

      const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.${format}`
      const buffer = wx.base64ToArrayBuffer(body)

      wx.getFileSystemManager().writeFile({
        filePath,
        data: buffer,
        encoding: 'binary',
        success() {
          resolve(filePath)
        },
        fail: reject
      })
    })
  },

  /**
   * 触发分享
   */
  triggerShare(title, desc) {
    // 小程序端分享需要用户主动触发
    // 这里只是准备分享数据
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none',
      duration: 2000
    })
  },

  /**
   * 分享配置
   */
  onShareAppMessage() {
    return {
      title: '拼豆糕手 - 像素画创作工具',
      path: '/pages/index/index',
      imageUrl: '/assets/share-cover.jpg'
    }
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于保存您的创作记录',
      success: (res) => {
        console.log('用户信息：', res.userInfo)

        // 将用户信息传回 H5
        this.postMessageToH5({
          type: 'USER_INFO',
          data: res.userInfo
        })
      },
      fail: (error) => {
        console.log('获取用户信息失败：', error)

        // 将失败信息传回 H5
        this.postMessageToH5({
          type: 'USER_INFO',
          data: null,
          error: error.errMsg
        })
      }
    })
  },

  /**
   * 预览图片
   */
  previewImage(urls, current = 0) {
    wx.previewImage({
      urls,
      current: typeof current === 'number' ? urls[current] : current
    })
  },

  /**
   * 发送消息到 H5
   */
  postMessageToH5(message) {
    // 只能在特定时机发送消息到 H5
    // 实际使用中，通常通过 URL 参数传递状态
    console.log('发送消息到 H5：', message)
  }
})
