// 为获取数据的一方   发布方？
import PubSub from 'pubsub-js'
// 处理事件 毫秒转分秒
import moment from 'moment'

import request from "../../utils/request"
// 获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false, //音乐是否在播放
    song: {}, //歌曲详情对象
    musicId: '', //音乐的id
    musicLink:'',
    currentTime:'00:00',  //音乐播放实时时间 
    durationTime:'00:00',  // 总时长
    currentWidth:0,     //实时进度条的宽度
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
    // console.log(musicId);
    this.setData({musicId})

    // console.log(options);
    // console.log(musicId);
    // 获取音乐详情
    this.getMusicInfo(musicId);

    
    /*
    问题：如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面是否播放的状态和真实的音乐播放状态不一致
    解决方案：
    1.通过控制音频的实例 BackgroundAudioManager 去监视音乐播放/暂停
     */

    //  判断当前页面音乐是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId ===musicId) {
      // this.changePlayState(true);
      this.setData({
        isPlay:true
      })
    }
    // 创建控制音乐播放的实例
    // 不用let 转用this，解决作用域的问题
    this.backgroundAudioManager = wx.getBackgroundAudioManager();

    // 监视音乐播放/暂停/停止
    this.backgroundAudioManager.onPlay(()=>{
      this.changePlayState(true);

      // 修改全局音乐播放的状态 (解决了用户切至其他小程序页面再返回时，音乐详情ui表现为关闭状态，即当前页面isPlay初始化为 false)
      // appInstance.globalData.isMusicPlay = true;
      appInstance.globalData.musicId = musicId
    });
    this.backgroundAudioManager.onPause(()=>{
      this.changePlayState(false);
      // 修改全局音乐播放的状态
      // appInstance.globalData.isMusicPlay = false;
    });
    this.backgroundAudioManager.onStop(()=>{
      this.changePlayState(false);
      // 修改全局音乐播放的状态
      // appInstance.globalData.isMusicPlay = false;
    });
    // 监听音乐播放自然结束
    this.backgroundAudioManager.onEnded(()=>{
      // 自动切换至下一首音乐，并自动播放
        PubSub.publish('swithType','next')
      // 将实时进度条的长度还原成 0;时间还原成零
      this.setData({
        currentWidth:0,
        currentTime:'00:00'
      })
    });
    // 监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(()=>{
      // console.log('总时长：',this.backgroundAudioManager.duration);
      // console.log('实时时间：',this.backgroundAudioManager.currentTime);
      // 需要转化成毫秒
      let currentTime = moment(this.backgroundAudioManager.currentTime *1000).format('mm:ss');
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration*450;
      this.setData({
        currentTime,
        currentWidth
      })
    })
  },

  // 修改播放状态的功能函数
  changePlayState(isPlay){
    this.setData({
      isPlay
    })
    // 修改全局音乐播放的状态
    appInstance.globalData.isMusicPlay = isPlay;
  },

  // 获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', {ids: musicId})
    // songData.song[0].dt  单位为ms
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    this.setData({
      song: songData.songs[0],
      durationTime
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
    let {musicId, musicLink} = this.data;
    this.musicControl(isPlay, musicId, musicLink);
  },

  // 控制音乐播放/暂停的功能函数
  async musicControl(isPlay, musicId, musicLink) {

    if (isPlay) {
      if (!musicLink) {
        // 获取音乐播放链接   || 优化后：如果有音乐链接的话就不发请求了，避免每一次点击都要发请求
        let musicLinkData = await request('/song/url', {id: musicId})
        musicLink = musicLinkData.data[0].url;

        this.setData({
          musicLink
        })
      }

      this.backgroundAudioManager.src = musicLink;
      // 这个title是必填项
      this.backgroundAudioManager.title = this.data.song.name;
      // console.log(this.data.song.name);
      // 播放音乐
      // backgroundAudioManager.play()
    } else {
      // 暂停音乐
      this.backgroundAudioManager.pause();
    }
  },

  // 点击切歌的回调
  handleSwitch(event){
    // 获取切歌的类型
    let type = event.currentTarget,id;

    // 切歌时，关闭当前播放的音乐
    this.backgroundAudioManager.stop();
    // 订阅来自recommendSong页面发布的musicId消息
    PubSub.subscribe('musicId',(msg,musicId)=>{
      console.log(musicId)

      // 获取音乐详情信息
      this.getMusicInfo(musicId)
      // 自动播放当前的音乐
      this.musicControl(true,musicId)
      // 取消订阅
      PubSub.unsubscribe('musicId')
    })

    // 发布消息给recommendSong页面
    PubSub.publish('swithType',type)
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