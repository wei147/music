import request from '../../utils/request'
let startY = 0;
let moveY = 0;
let moveDistance = 0;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverTransform: 'translateY(0)',
    coveTransition:'',
    userInfo:{},    //用户信息
    recordPlayList:{}   //最近播放记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = wx.getStorageSync('userInfo');
    // console.log('userInfo:',userInfo)
    if (userInfo) {
      // 更新userInfo的状态
      this.setData({
        userInfo:JSON.parse(userInfo) //当时转成JSON，现在用的时候要反编译一下
      })
      //获取用户播放记录
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
  },

  async getUserRecentPlayList(userId){
    let recordPlayListData =await request('/user/record',{'uid':userId,'type':0});
    // 手动的加一个index做wxml中wx:key值
    let index = 0;
    let recordPlayList = recordPlayListData.allData.splice(1,10).map(item=>{
      item.id = index++;
      return item;
    })
    this.setData({
      recordPlayList
    })
    // console.log(recordData.weekData[0])
  },

  // 跳转至登录login界面的回调
  toLoginPage(){
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },

  handleTouchStart(event){
    this.setData({
      coveTransition:''
    })
    // 获取手指的起始坐标
    startY = event.touches[0].clientY;
  },

  handleTouchMove(event){
    moveY = event.touches[0].clientY;
    // movieDistance 即为手指移动的距离
    moveDistance = moveY-startY;

    // 不让其向上动
    if(moveDistance<=0){
      return;
    }
    if(moveDistance >=80){
      moveDistance = 80
    }
    // 动态的更新  coverTransform状态值
    this.setData({
      coverTransform:`translateY(${moveDistance}rpx)`,
      coveTransition:`transform 1s linear`
    })
  },

  handleTouchEnd(){
    this.setData({
      coverTransform:`translateY(0rpx)`
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

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