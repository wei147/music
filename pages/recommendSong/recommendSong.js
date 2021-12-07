import request from "../../utils/request"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day:'',
    month:'',
    recommendList:[]  //推荐列表数据

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userInfo = wx.getStorageInfoSync('userinfo')
    if (!userInfo) {
      wx.showToast({
        title: '获取每日推荐歌单需要先登录',
        icon:'none',
        success:()=>{
          // 跳转至登录页面
          wx.reLaunch({
            url: '/pages/login/login',
          })
        }
      })
    }
    //更新日期的状态数据
    this.setData({
      day:new Date().getDate(),
      month:new Date().getMonth()+1
    })

    // 获取每日推荐的数据
    this.getRecommendList()
  },

  // 获取用户每日推荐的数据
  async getRecommendList(){

    let recommendListData = await request('/recommend/songs')
    this.setData({
      recommendList:recommendListData.recommend.slice(0,12)
    })
  },

  // 跳转至songDetail页面
  toSongDetail(event){
    // <!-- 利用data-  传参 -->
    let song =event.currentTarget.dataset.song;
    // console.log(song);
    // 路由跳转传参： query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长，会被自动截取掉
      // url: '/pages/songDetail/songDetail?songId='+JSON.stringify(songId),//传参数时应该先转成字符串
      url: '/pages/songDetail/songDetail?musicId='+song.id, 
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