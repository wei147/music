// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    msg: 'test',
    userInfo: {}, //用户的基本信息
    hasUserInfo: false,
  },

  // handleParent(){
  //   console.log('Parent')
  // },
  // handleChild(){
  //   console.log('Child')
  // },

  // 跳转至logs界面的方法
  toLogs() {
    wx.navigateTo({
      url: '/pages/logs/logs',
    })
  },

  getUserProfile(e) {
    wx.getUserProfile({
      desc: '获取你的头像、昵称信息',
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
        })
      },
      fail: (err) => {
        console.log('用户拒绝授权');
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 最先执行
    // console.log('onLoad()监听页面加载')
    // debugger;
    // 修改msg的状态数据，语法：this.setData
    //this代表当前页面的实例对象
    // setTimeout(() => {
    //   this.setData({
    //       msg: '测试'
    //     }),
    //     console.log(this.data.msg)
    // }, 2000)

    // 授权以后获取用户信息
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // console.log('onReady()监听页面初次渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // console.log('onShow()监听页面显示 执行多次')
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // console.log('onHide() 监听页面隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // console.log('onUnload() 监听页面卸载')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})