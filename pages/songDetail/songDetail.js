import request from "../../utils/request"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false, //音乐是否在播放
    song: {}, //歌曲详情对象
    musicId: '', //音乐的id
    musicTitle: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */

  onLoad: function (options) {
    // options:用于接收路由跳转的query参数
    // 原生小程序中路由传参，对参数的长度有限制，如果参数长度过长会自动截取掉
    // console.log(options.songId);
    // console.log(JSON.parse(options.songId));  //反编译成json对象
    let musicId = options.musicId;

    // console.log(options);
    // console.log(musicId);
    // 获取音乐详情
    this.getMusicInfo(musicId);
    /*
    问题：如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面是否播放的状态和真实的音乐播放状态不一致
    解决方案：
    1.通过控制音频的实例 BackgroundAudioManager 去监视音乐播放/暂停
     */

    // 创建控制音乐播放的实例
    // 不用let 转用this，解决作用域的问题
    this.backgroundAudioManager = wx.getBackgroundAudioManager();

    // 监视音乐播放/暂停/停止
    this.backgroundAudioManager.onPlay(()=>{
      this.changePlayState(true);
    });
    this.backgroundAudioManager.onPause(()=>{
      this.changePlayState(false);
    });
    this.backgroundAudioManager.onStop(()=>{
      this.changePlayState(false);
    });
    this.setData({musicId})
  },

  // 修改播放状态的功能函数
  changePlayState(isPlay){
    this.setData({
      isPlay
    })
  },

  // 获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', {
      ids: musicId
    })
    this.setData({
      song: songData.songs[0]
    })
    // 动态修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.name,
    })
  },

  //  点击/暂停的回调
  handleMusicPlay() {
    let isPlay = !this.data.isPlay;
    // // 修改是否播放的状态  （经过代码优化，已弃用）
    // this.setData({
    //   isPlay
    // })
    // let musicId = this.data.musicId;   等同？
    let {musicId} = this.data;
    this.musicControl(isPlay, musicId);
  },

  // 控制音乐播放/暂停的功能函数
  async musicControl(isPlay, musicId) {

    if (isPlay) {
      // 获取音乐播放链接
      let musicLinkData = await request('/song/url', {id: musicId})
      let musicLink = musicLinkData.data[0].url;

      this.backgroundAudioManager.src = musicLink;
      // 这个title是必填项
      this.backgroundAudioManager.title = this.data.song.name;
      console.log(this.data.song.name);
      // 播放音乐
      // backgroundAudioManager.play()
    } else {
      // 暂停音乐
      this.backgroundAudioManager.pause();
    }
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