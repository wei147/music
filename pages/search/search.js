import request from "../../utils/request"
let isSend = false
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchDefault: '', //placeholder的内容
    searchHotList: [], //热搜榜数据
    searchContent: '', //用户输入的表单项数据
    searchList: [], //关键字模糊匹配的数据
    historyList: [] //搜索历史记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getSearchDefault()
    this.getSearchHot()
    this.getSearchList()
    this.getSearchHistory()
  },

  // 获取本地历史记录的功能函数
  getSearchHistory() {
    let historyList = wx.getStorageSync('searchHistory')
    if (historyList) {
      this.setData({
        historyList
      })
    }
  },

  // 获取默认搜索的数据
  async getSearchDefault() {
    let searchDefaultData = await request('/search/default')
    this.setData({
      searchDefault: searchDefaultData.data.showKeyword
    })
  },

  async getSearchHot() {
    let searchHotData = await request('/search/hot/detail')
    this.setData({
      searchHotList: searchHotData.data
    })
  },

  // 表单项内容发生改变的回调
  handleInputcChange(event) {
    this.setData({
      searchContent: event.detail.value.trim(),
    })
    if (isSend) {
      return
    }
    isSend = true;
    this.getSearchList();
    // 函数节流
    setTimeout(() => {
      isSend = false
    }, 300)
  },

  // 获取搜索数据的功能函数
  async getSearchList() {
    // 如果发送是空字符串则不发请求
    if (!this.data.searchContent) {
      this.setData({
        // 将searchList置空，则在删除搜索关键词之后让搜索结果消失，显示热搜榜
        searchList: []
      })
      return;
    }
    // 发请求获取关键字模糊匹配数据
    let {
      searchContent,
      historyList
    } = this.data;
    // 获取关键字模糊匹配数据
    let searchListtData = await request('/search', {
      keywords: searchContent,
      limit: 10
    })
    this.setData({
      searchList: searchListtData.result.songs
    })

    //将搜索关键字添加到搜索历史记录中
    if (historyList.indexOf(searchContent) !== -1) {
      historyList.splice(historyList.indexOf(searchContent), 1) //删除数组里重复的那一个，再增加
    }
    // unshift()；是要入数组头部的一个或多个值。返回的是数组的新长度
    historyList.unshift(searchContent);
    this.setData({
      historyList
    })
    wx.setStorageSync('searchHistory', historyList);
  },

  clearSearchContent() {
    // 清掉搜索关键字的同时应该要把请求来到搜索内容清掉
    this.setData({
      searchContent: '',
      searchList: []
    })
  },
  // 删除搜索记录
  clearAll_history() {
    wx.showModal({
      content: '确定删除？',
      success: ((res) => {
        if (res.confirm) {
          // 清空data中的historyList
          this.setData({
            historyList: []
          })
          //移除本地的历史记录缓存 
          wx.removeStorageSync('searchHistory')
        }
      }),
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