import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [], //导航标签数据
    navId: '', //导航的标识
    videoList: [], //视频列表数据
    videoId:'', //视频id标识
    videoUpdataTime:[], //记录video播放的时长
    isTriggered:false //标识下拉刷新是否被触发
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取导航栏数据
    this.getVideoGroupListData();
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0, 14), //截取14个 0~13
      navId: videoGroupListData.data[0].id
    })
    // 获取视频列表数据
    // 什么时候拿到了导航标签的数据，才调用方法发请求
    this.getVideoList(this.data.navId)
  },
  //  获取视频列表数据
  async getVideoList(navId) {
    let videoListData = await request('/video/group', {
      id: navId
    })
    // 关闭加载提示框
    wx.hideLoading()
    let index = 0;
    let videoList = videoListData.datas.map(item => {
      item.id = index++;
      return item;
    })
    
    this.setData({
      videoList,
      isTriggered:false // 关闭下拉刷新 
    })
  },

  // 点击切换导航的回调
  changeNav(event) {
    // let navId = event.currentTarget.id; //通过id向event传参的时候如果传的是number会自动转换成string
    let navId = event.currentTarget.dataset.id;
    // console.log(typeof navId) //为字符，String。需要转成数字
    this.setData({
      navId: navId,
      // 切换到另一个导航标签时将原先的页面置为空白
      videoList: []
    })
    // 显示正在加载
    wx.showLoading({
      title: '加载中',
    })
    // 动态的获取当前导航对应的视频数据
    this.getVideoList(this.data.navId)

  },

  // 点击播放/继续播放的回调
  handlePlay(event) {
    /*
    问题：多个视频可以同时播放的问题
      需求：
      1.在点击播放的事件中需要找到上一个播放的视频
      2.在播放新的视频之前关闭上一个正在播放的视频
      关键：
      1.如何找到上一个视频的实例对象
      2.如何确认点击播放的视频和正在播放的视频不是同一个视频
      单例模式：
      1.需要创建多个对象的场景下，通过一个变量的接收，始终保持只有一个对象，
      2.节省内存空间
    */
    let vid = event.currentTarget.id;
    // 关闭上一个正在播放的视频 （如果是第一个视频，则当前videoContext值为空，等有第二个值才会关闭上一个）
    // 这个vid不等于上一个点击的vid而且当其有值才会调用stop() 方法
    // this.vid !==vid && this.videoContext && this.videoContext.stop();  (因为性能优化，作罢)
    // 两种写法
    // if (this.vid !==vid) {
    //   if (this.videoContext) {
    //     this.videoContext.stop();
    //   }
    // }
    // this.vid = vid (因为性能优化，作罢)
    // 更新data中videoId的状态数据
    this.setData({
      videoId:vid
    })

    //  创建控制video标签的实例对象 
    this.videoContext = wx.createVideoContext(vid)
    // 判断当前的视频之前是否有播放过，是否有播放记录，如果有，跳转至指定的播放位置
    let {videoUpdataTime} = this.data;
    let videoItem = videoUpdataTime.find(item => item.vid === vid);
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play(); //autoplay

  },

  // 监听视频播放进度的回调
  handleTimeUpdata(event){
    // console.log(event.detail.currentTime)
    let videoTimeObj = {vid:event.currentTarget.id,currentTime:event.detail.currentTime};
    let {videoUpdataTime} = this.data

    /**
     * 思路：判断记录播放时长的videoUpdataTime数组中是否有当前视频的播放记录
     * 1.如果有，在原有的播放记录在修改播放时间为当前的播放时间
     * 2.如果没有，需要在数组中添加当前视频的播放对象
     */
    let videoItem = videoUpdataTime.find(item => item.vid === videoTimeObj.vid);  //判断有没有vid，没有则返回false
    if (videoItem) {  //之前有
      videoItem.currentTime = event.detail.currentTime;
    }else{  //之前没有
      videoUpdataTime.push(videoTimeObj);
    }
    // 更新videoItem的状态
    this.setData({
      videoUpdataTime
    })
  },

  // 视频播放结束调用的回调
  handleEnded(event){
    // 移除记录播放时长数组中当前视频的对象
    // console.log("播放结束")
    let {videoUpdataTime} = this.data;
    // 删除播放结束的那个数组下标的记录
    videoUpdataTime.splice(videoUpdataTime.findIndex(item => item.vid ==event.currentTarget.id),1);
    this.setData({
      videoUpdataTime
    })
  },

  // 自定义下拉刷新的回调 scroll-view
  handleRefresher(){
    // console.log("scroll-view")
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 上拉触底的回调 scroll-view
  handleToLower(){
    console.log("触底");
    // 数据分页   1.后端分页 2.前端分页
    // console.log('发送请求 || 在前端截取最新的数据 追加到视频列表的后方');
    // console.log('网易云音乐暂时没有提供分页的api');
    // 模拟数据
    let newVideoList=[
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_EF014AF2577A067E8D3AB51023D22C2B",
        coverUrl: "https://p1.music.126.net/mB_VZLkocw0ATPLoOWpMLA==/109951163572655930.jpg",
        height: 720,
        width: 1280,
        title: "Ariana Grande《One Last Time》高清现场版，A妹激动的哭了",
        description: "#Ariana Grande#《One Last Time》高清现场版，“A妹”激动的哭了，身后站了一排明星大咖！",
        commentCount: 120,
        shareCount: 230,
        resolutions: [
        {
        resolution: 240,
        size: 29964297
        },
        {
        resolution: 480,
        size: 42790602
        },
        {
        resolution: 720,
        size: 68446132
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 110000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/MC2hQV_zsLpILDWcJgJbAA==/18558656767256663.jpg",
        accountStatus: 0,
        gender: 1,
        city: 110101,
        birthday: 1607875200000,
        userId: 574797414,
        userType: 0,
        nickname: "HD音乐现场",
        signature: "直击最酷、最震撼的音乐现场，只发高清！",
        description: "",
        detailDescription: "",
        avatarImgId: 18558656767256664,
        backgroundImgId: 109951164052628460,
        backgroundUrl: "http://p1.music.126.net/AftzRHSrwI5uYB8CzxuK2g==/109951164052628468.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: {
        1: "音乐视频达人"
        },
        djStatus: 0,
        vipType: 11,
        remarkName: null,
        avatarImgIdStr: "18558656767256663",
        backgroundImgIdStr: "109951164052628468"
        },
        urlInfo: {
        id: "EF014AF2577A067E8D3AB51023D22C2B",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/9fouseSW_22215770_shd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=OvqQqlAFeEcEpluzkFvoFPigrVAatMVw&sign=c0e28a07dc742279c4ee0d855dd8aed5&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 68446132,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 720
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [
        {
        name: "One Last Time",
        id: 28977745,
        pst: 0,
        t: 0,
        ar: [
        {
        id: 48161,
        name: "Ariana Grande",
        tns: [ ],
        alias: [ ]
        }
        ],
        alia: [ ],
        pop: 100,
        st: 0,
        rt: null,
        fee: 1,
        v: 60,
        crbt: null,
        cf: "",
        al: {
        id: 2887197,
        name: "My Everything (Deluxe Version)",
        picUrl: "http://p4.music.126.net/GgcUjP6SA8N1fAOQOKQPIg==/109951166048566402.jpg",
        tns: [ ],
        pic_str: "109951166048566402",
        pic: 109951166048566400
        },
        dt: 197280,
        h: {
        br: 320000,
        fid: 0,
        size: 7894248,
        vd: -26600
        },
        m: {
        br: 192000,
        fid: 0,
        size: 4736566,
        vd: -23900
        },
        l: {
        br: 128000,
        fid: 0,
        size: 3157725,
        vd: -22300
        },
        a: null,
        cd: "1",
        no: 3,
        rtUrl: null,
        ftype: 0,
        rtUrls: [ ],
        djId: 0,
        copyright: 1,
        s_id: 0,
        rtype: 0,
        rurl: null,
        mst: 9,
        cp: 7003,
        mv: 384693,
        publishTime: 1408896000000,
        privilege: {
        id: 28977745,
        fee: 1,
        payed: 0,
        st: 0,
        pl: 0,
        dl: 0,
        sp: 0,
        cp: 0,
        subp: 0,
        cs: false,
        maxbr: 999000,
        fl: 0,
        toast: false,
        flag: 4,
        preSell: false
        }
        }
        ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "EF014AF2577A067E8D3AB51023D22C2B",
        durationms: 261619,
        playTime: 280877,
        praisedCount: 2514,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_5F40BCAC9AF915500962075E6FDF429B",
        coverUrl: "https://p1.music.126.net/sxNtuPa29019pzdrKwZ9bQ==/109951164913470787.jpg",
        height: 1080,
        width: 1920,
        title: "现在00后太强了，小女孩开口成熟烟嗓，张碧晨都感动哭了",
        description: "现在00后太强了，小女孩开口成熟烟嗓，张碧晨都感动哭了",
        commentCount: 104,
        shareCount: 65,
        resolutions: [
        {
        resolution: 240,
        size: 19593948
        },
        {
        resolution: 480,
        size: 33064960
        },
        {
        resolution: 720,
        size: 49227246
        },
        {
        resolution: 1080,
        size: 93162931
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 330000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/GSABhoZKKa9h48blcC1XDQ==/109951164575599087.jpg",
        accountStatus: 0,
        gender: 1,
        city: 330100,
        birthday: -2209017600000,
        userId: 2077929525,
        userType: 0,
        nickname: "唯一音乐吐槽酱",
        signature: "每日优秀好听国内外音乐推荐，音乐如此不平凡",
        description: "",
        detailDescription: "",
        avatarImgId: 109951164575599090,
        backgroundImgId: 109951162868126480,
        backgroundUrl: "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: {
        1: "音乐视频达人"
        },
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951164575599087",
        backgroundImgIdStr: "109951162868126486"
        },
        urlInfo: {
        id: "5F40BCAC9AF915500962075E6FDF429B",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/o5Bp88tn_2973328826_uhd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=JhxhqbRPIWibaHHpvcPIwUoceiLmxSPV&sign=4af23ee9b11bfc31922d0a7c4d28409a&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 93162931,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 1080
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 58101,
        name: "听BGM",
        alg: null
        },
        {
        id: 4101,
        name: "娱乐",
        alg: null
        },
        {
        id: 3100,
        name: "影视",
        alg: null
        },
        {
        id: 3101,
        name: "综艺",
        alg: null
        },
        {
        id: 94101,
        name: "评论与解说",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [
        {
        name: "岁月神偷",
        id: 1313052971,
        pst: 0,
        t: 0,
        ar: [
        {
        id: 5538,
        name: "汪苏泷",
        tns: [ ],
        alias: [ ]
        },
        {
        id: 28900376,
        name: "刘乐瑶",
        tns: [ ],
        alias: [ ]
        }
        ],
        alia: [ ],
        pop: 100,
        st: 0,
        rt: null,
        fee: 0,
        v: 9,
        crbt: null,
        cf: "",
        al: {
        id: 73468127,
        name: "中国新声代 第五季 第十一期",
        picUrl: "http://p4.music.126.net/G86tg6ubdmfgS5kb3ZIfTA==/109951163589412319.jpg",
        tns: [ ],
        pic_str: "109951163589412319",
        pic: 109951163589412320
        },
        dt: 236000,
        h: {
        br: 320000,
        fid: 0,
        size: 9442787,
        vd: -43300
        },
        m: {
        br: 192000,
        fid: 0,
        size: 5665689,
        vd: -40800
        },
        l: {
        br: 128000,
        fid: 0,
        size: 3777141,
        vd: -39000
        },
        a: null,
        cd: "01",
        no: 4,
        rtUrl: null,
        ftype: 0,
        rtUrls: [ ],
        djId: 0,
        copyright: 0,
        s_id: 0,
        rtype: 0,
        rurl: null,
        mst: 9,
        cp: 0,
        mv: 0,
        publishTime: 1538755200007,
        privilege: {
        id: 1313052971,
        fee: 0,
        payed: 0,
        st: 0,
        pl: 320000,
        dl: 999000,
        sp: 7,
        cp: 1,
        subp: 1,
        cs: false,
        maxbr: 999000,
        fl: 320000,
        toast: false,
        flag: 256,
        preSell: false
        }
        }
        ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "5F40BCAC9AF915500962075E6FDF429B",
        durationms: 216747,
        playTime: 485620,
        praisedCount: 2320,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_9B5C7DF79B7DBC309FA47F7631FE72A3",
        coverUrl: "https://p1.music.126.net/gT1auI6HR5Lvw0-sP2GcEA==/109951164788191358.jpg",
        height: 720,
        width: 1280,
        title: "Taylor Swift霉霉《 Love Story》拿去表白吧~",
        description: "#在云村看现场# Taylor Swift 《Love Story》现场版，一首被很多人用于表白的歌，愿你在八月猝不及防地坠入爱河~ ",
        commentCount: 611,
        shareCount: 2057,
        resolutions: [
        {
        resolution: 240,
        size: 25665547
        },
        {
        resolution: 480,
        size: 43285834
        },
        {
        resolution: 720,
        size: 59542661
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 110000,
        authStatus: 1,
        followed: false,
        avatarUrl: "http://p1.music.126.net/w9sQfaK_Xissw1pmu9LcXw==/109951163536090163.jpg",
        accountStatus: 0,
        gender: 2,
        city: 110101,
        birthday: -2209017600000,
        userId: 1539973165,
        userType: 10,
        nickname: "在云村看现场",
        signature: "网易云音乐是6亿人都在使用的音乐平台，致力于帮助音乐爱好者发现音乐惊喜，帮助音乐人实现梦想。 在云村看现场独家策划专题每周周末更新，欢迎各位村民私信或者@优质音乐现场内容！ 如果仍然不能解决您的问题，请邮件我们： 用户：ncm5990@163.com 音乐人：yyr599@163.com",
        description: "在云村看现场官方",
        detailDescription: "在云村看现场官方",
        avatarImgId: 109951163536090160,
        backgroundImgId: 109951162868126480,
        backgroundUrl: "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: null,
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951163536090163",
        backgroundImgIdStr: "109951162868126486"
        },
        urlInfo: {
        id: "9B5C7DF79B7DBC309FA47F7631FE72A3",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/1Euwg3Lr_1896296809_shd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=QMYQGdwXJAHTRQuTRNituWtusYsxEaLB&sign=0f49490011089f2c590066adada3d937&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 59542661,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 720
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 9102,
        name: "演唱会",
        alg: null
        },
        {
        id: 57106,
        name: "欧美现场",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        },
        {
        id: 16158,
        name: "乡村",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: [
        110
        ],
        relateSong: [ ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "9B5C7DF79B7DBC309FA47F7631FE72A3",
        durationms: 242694,
        playTime: 2027612,
        praisedCount: 20738,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_3AC17C3E75EF121DB48723E463E7767E",
        coverUrl: "https://p1.music.126.net/KLjCVx97YN9ropBK5wFeDg==/109951163756842487.jpg",
        height: 720,
        width: 1280,
        title: "笑着说再见的时候，嗓子里如果有血，应该也是甜的。",
        description: null,
        commentCount: 1307,
        shareCount: 2595,
        resolutions: [
        {
        resolution: 240,
        size: 57631758
        },
        {
        resolution: 480,
        size: 86479548
        },
        {
        resolution: 720,
        size: 131903216
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 120000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/f1pKgwwgbUhI91V75vXaZA==/109951164600166109.jpg",
        accountStatus: 0,
        gender: 2,
        city: 120101,
        birthday: 877968000000,
        userId: 99415817,
        userType: 0,
        nickname: "西野七瀬nanase",
        signature: "我祈祷我选择的道路是正确的，并为各位在今后的道路上，能有很多开心的、高兴的、感觉幸福的、觉得这样真好的很多的事情而祈祷。",
        description: "",
        detailDescription: "",
        avatarImgId: 109951164600166110,
        backgroundImgId: 109951163588993580,
        backgroundUrl: "http://p1.music.126.net/pP8Cr9iZ_csn9lbVEZZ2tA==/109951163588993585.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: null,
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951164600166109",
        backgroundImgIdStr: "109951163588993585"
        },
        urlInfo: {
        id: "3AC17C3E75EF121DB48723E463E7767E",
        url: "http://vodkgeyttp9.vod.126.net/cloudmusic/bUOMaLvH_2221592874_shd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=SQDdxBrZFakZbyIHyiIscDQWcJgrhNfv&sign=a64352993579092bcb75d28ff137e69b&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 131903216,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 720
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 60101,
        name: "日语现场",
        alg: null
        },
        {
        id: 57108,
        name: "流行现场",
        alg: null
        },
        {
        id: 59108,
        name: "巡演现场",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: [
        110
        ],
        relateSong: [ ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "3AC17C3E75EF121DB48723E463E7767E",
        durationms: 325000,
        playTime: 5392311,
        praisedCount: 22613,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_DE1FE442AD2259397BEFC5A12A4921E2",
        coverUrl: "https://p1.music.126.net/CNwgi-nwE-lLs97Hw2zg1A==/109951163797950766.jpg",
        height: 960,
        width: 540,
        title: "TFBOYS演唱《信仰之名》，一开口全场就沸腾了！",
        description: "TFBOYS演唱《信仰之名》，一开口全场就沸腾了！",
        commentCount: 935,
        shareCount: 143,
        resolutions: [
        {
        resolution: 240,
        size: 6393070
        },
        {
        resolution: 480,
        size: 10613179
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 350000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/mRheVeBV30ssvQHfcNoMlw==/109951163799055782.jpg",
        accountStatus: 0,
        gender: 0,
        city: 350100,
        birthday: -2209017600000,
        userId: 1726799967,
        userType: 0,
        nickname: "老衲洗发用飘流",
        signature: "",
        description: "",
        detailDescription: "",
        avatarImgId: 109951163799055780,
        backgroundImgId: 109951162868128400,
        backgroundUrl: "http://p1.music.126.net/2zSNIqTcpHL2jIvU6hG0EA==/109951162868128395.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: null,
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951163799055782",
        backgroundImgIdStr: "109951162868128395"
        },
        urlInfo: {
        id: "DE1FE442AD2259397BEFC5A12A4921E2",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/H0dTe1iH_2254578200_hd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=kgrLXbbDnBdGBTLMuSYYgaVmUkQnGOfM&sign=ba2fb46ffef76dee0993d31e3225ee33&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 10613179,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 480
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 59101,
        name: "华语现场",
        alg: null
        },
        {
        id: 57108,
        name: "流行现场",
        alg: null
        },
        {
        id: 59108,
        name: "巡演现场",
        alg: null
        },
        {
        id: 11137,
        name: "TFBOYS",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        },
        {
        id: 25108,
        name: "王俊凯",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [ ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "DE1FE442AD2259397BEFC5A12A4921E2",
        durationms: 46116,
        playTime: 339237,
        praisedCount: 2345,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_066CADD4BAF66C303A6E017E7F765B7D",
        coverUrl: "https://p1.music.126.net/iwVBIEoVAjYQlEMUOsvQIg==/109951163841943262.jpg",
        height: 960,
        width: 540,
        title: "_AOA(_(Bing_Bing)官方饭拍",
        description: "",
        commentCount: 32,
        shareCount: 77,
        resolutions: [
        {
        resolution: 240,
        size: 14484133
        },
        {
        resolution: 480,
        size: 22245469
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 370000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/CpYxUgtVrT4msVbwb8luxw==/109951163709386104.jpg",
        accountStatus: 0,
        gender: 0,
        city: 370200,
        birthday: -2209017600000,
        userId: 1580855684,
        userType: 0,
        nickname: "颢天是我",
        signature: "我的等待，其实只是为了积累足够多的失望。",
        description: "",
        detailDescription: "",
        avatarImgId: 109951163709386110,
        backgroundImgId: 109951162868126480,
        backgroundUrl: "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: null,
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951163709386104",
        backgroundImgIdStr: "109951162868126486"
        },
        urlInfo: {
        id: "066CADD4BAF66C303A6E017E7F765B7D",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/oP3WebET_2257725263_hd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=hwOpkhkhzyWCVGXkkMDCdSxfQIUlDnIV&sign=cde632bf2d2f57fd6a438b3e0982e735&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 22245469,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 480
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 1101,
        name: "舞蹈",
        alg: null
        },
        {
        id: 57107,
        name: "韩语现场",
        alg: null
        },
        {
        id: 57108,
        name: "流行现场",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [
        {
        name: "빙빙(Bing Bing)",
        id: 450222545,
        pst: 0,
        t: 0,
        ar: [
        {
        id: 126312,
        name: "AOA",
        tns: [ ],
        alias: [ ]
        }
        ],
        alia: [ ],
        pop: 95,
        st: 0,
        rt: null,
        fee: 8,
        v: 43,
        crbt: null,
        cf: "",
        al: {
        id: 35104102,
        name: "ANGEL`S KNOCK",
        picUrl: "http://p3.music.126.net/VUfU4ZeZU9sOOa_9qdCSAA==/18673005976799475.jpg",
        tns: [ ],
        pic_str: "18673005976799475",
        pic: 18673005976799476
        },
        dt: 191226,
        h: {
        br: 320000,
        fid: 0,
        size: 7651831,
        vd: -86105
        },
        m: {
        br: 192000,
        fid: 0,
        size: 4591116,
        vd: -86105
        },
        l: {
        br: 128000,
        fid: 0,
        size: 3060759,
        vd: -86105
        },
        a: null,
        cd: "1",
        no: 2,
        rtUrl: null,
        ftype: 0,
        rtUrls: [ ],
        djId: 0,
        copyright: 2,
        s_id: 0,
        rtype: 0,
        rurl: null,
        mst: 9,
        cp: 1410822,
        mv: 5431033,
        publishTime: 1483286400007,
        tns: [
        "转悠悠"
        ],
        privilege: {
        id: 450222545,
        fee: 8,
        payed: 0,
        st: 0,
        pl: 128000,
        dl: 0,
        sp: 7,
        cp: 1,
        subp: 1,
        cs: false,
        maxbr: 999000,
        fl: 128000,
        toast: false,
        flag: 260,
        preSell: false
        }
        }
        ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "066CADD4BAF66C303A6E017E7F765B7D",
        durationms: 194294,
        playTime: 140204,
        praisedCount: 1006,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_C6D67F21F2B199C2F7FF24C5B9A85811",
        coverUrl: "https://p1.music.126.net/MMvbC08mpuNi0Dln2QjI-Q==/109951163764709280.jpg",
        height: 720,
        width: 1280,
        title: "2019湖南卫视跨年演唱会，TFBOYS成年后合体首秀！",
        description: "2019湖南卫视跨年演唱会，TFBOYS成年后合体首秀。 共计演唱五首歌，看看他们的彩排现场效果如何。",
        commentCount: 182,
        shareCount: 291,
        resolutions: [
        {
        resolution: 240,
        size: 21936835
        },
        {
        resolution: 480,
        size: 38198486
        },
        {
        resolution: 720,
        size: 52887909
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 110000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/JJ9-kUtpp9dp6Cze-qJdaA==/109951163008355124.jpg",
        accountStatus: 0,
        gender: 2,
        city: 110111,
        birthday: 725817600000,
        userId: 356020622,
        userType: 0,
        nickname: "周易慌儿",
        signature: "",
        description: "",
        detailDescription: "",
        avatarImgId: 109951163008355120,
        backgroundImgId: 109951163009179070,
        backgroundUrl: "http://p1.music.126.net/95sBDRAHqrD549rskxZf_g==/109951163009179066.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: null,
        djStatus: 10,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951163008355124",
        backgroundImgIdStr: "109951163009179066"
        },
        urlInfo: {
        id: "C6D67F21F2B199C2F7FF24C5B9A85811",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/4X1lK7dI_2227866657_shd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=KxgFgudNwdTxjUPgEdyXQoUtPJInCKSt&sign=561f92ac46cc635d88b92fe108be76e9&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 52887909,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 720
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 59101,
        name: "华语现场",
        alg: null
        },
        {
        id: 57108,
        name: "流行现场",
        alg: null
        },
        {
        id: 59108,
        name: "巡演现场",
        alg: null
        },
        {
        id: 11137,
        name: "TFBOYS",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [ ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "C6D67F21F2B199C2F7FF24C5B9A85811",
        durationms: 139459,
        playTime: 1151370,
        praisedCount: 7673,
        praised: false,
        subscribed: false
        }
        },
        {
        type: 1,
        displayed: false,
        alg: "onlineHotGroup",
        extAlg: null,
        data: {
        alg: "onlineHotGroup",
        scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
        threadId: "R_VI_62_F73B74737F6B320719C9C5B7020F4F1B",
        coverUrl: "https://p1.music.126.net/_8Y-4pHgfsrO29o0CUdIqQ==/109951163574074445.jpg",
        height: 720,
        width: 1280,
        title: "TFBOYS - 大梦想家（2160806三周年北京演唱会）",
        description: "插上竹蜻蜓张开了翅膀 飞到任何想要去的地方",
        commentCount: 182,
        shareCount: 411,
        resolutions: [
        {
        resolution: 240,
        size: 47639521
        },
        {
        resolution: 480,
        size: 62936007
        },
        {
        resolution: 720,
        size: 90103606
        }
        ],
        creator: {
        defaultAvatar: false,
        province: 110000,
        authStatus: 0,
        followed: false,
        avatarUrl: "http://p1.music.126.net/5rK5EE48oekIjNHyR3GIYg==/109951163424583352.jpg",
        accountStatus: 0,
        gender: 0,
        city: 110101,
        birthday: -2209017600000,
        userId: 1345020800,
        userType: 0,
        nickname: "拾號播放器",
        signature: "让我们一起泡在音乐水里面",
        description: "",
        detailDescription: "",
        avatarImgId: 109951163424583360,
        backgroundImgId: 109951162868128400,
        backgroundUrl: "http://p1.music.126.net/2zSNIqTcpHL2jIvU6hG0EA==/109951162868128395.jpg",
        authority: 0,
        mutual: false,
        expertTags: null,
        experts: {
        1: "音乐视频达人"
        },
        djStatus: 0,
        vipType: 0,
        remarkName: null,
        avatarImgIdStr: "109951163424583352",
        backgroundImgIdStr: "109951162868128395"
        },
        urlInfo: {
        id: "F73B74737F6B320719C9C5B7020F4F1B",
        url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/Am4OS0hy_1835995920_shd.mp4?ts=1638616291&rid=A7D9378CA18360278A1D122E5E77AA17&rl=3&rs=MLUvjuLzUVSXkyhLbRrsvXInzYbQJlPq&sign=434a3af010215fa0c2f288c1bfcc08fb&ext=UMkl2tPgxuliPELDzuMmB4LP0CkGbx0UJOVLbnGgd7m1qvklYK1CXpPKc4cTXo7AngR4O9pdmce3HHzyHvLIgEkHZ9JCcsWowm0CRG32d8f4Y2%2F5cQV2CRzoGPZnatzNotTMHw10wuwHH1LD6ltRydMv0C0tacmvtTrFlNXoIHSncGoLmfaaSp%2FiuUYSbXNwhmptDaX9BJytQztTxdFJLckFuHoydIacAksGjLy2Kh3Hr1zSgqdfjomPsgKxFOxu",
        size: 90103606,
        validityTime: 1200,
        needPay: false,
        payInfo: null,
        r: 720
        },
        videoGroup: [
        {
        id: 58100,
        name: "现场",
        alg: null
        },
        {
        id: 59101,
        name: "华语现场",
        alg: null
        },
        {
        id: 57108,
        name: "流行现场",
        alg: null
        },
        {
        id: 59108,
        name: "巡演现场",
        alg: null
        },
        {
        id: 11137,
        name: "TFBOYS",
        alg: null
        },
        {
        id: 1100,
        name: "音乐现场",
        alg: null
        },
        {
        id: 5100,
        name: "音乐",
        alg: null
        }
        ],
        previewUrl: null,
        previewDurationms: 0,
        hasRelatedGameAd: false,
        markTypes: null,
        relateSong: [
        {
        name: "大梦想家 (Live)",
        id: 35040812,
        pst: 0,
        t: 0,
        ar: [
        {
        id: 827728,
        name: "TFBOYS",
        tns: [ ],
        alias: [ ]
        }
        ],
        alia: [ ],
        pop: 100,
        st: 0,
        rt: null,
        fee: 0,
        v: 389,
        crbt: null,
        cf: "",
        al: {
        id: 3308594,
        name: "2015年央视中秋晚会",
        picUrl: "http://p4.music.126.net/Or3N9FxqPvVMmIYlziOjJw==/3419481162394664.jpg",
        tns: [ ],
        pic: 3419481162394664
        },
        dt: 180897,
        h: null,
        m: null,
        l: {
        br: 128000,
        fid: 0,
        size: 2895246,
        vd: 44216
        },
        a: null,
        cd: "1",
        no: 8,
        rtUrl: null,
        ftype: 0,
        rtUrls: [ ],
        djId: 0,
        copyright: 0,
        s_id: 0,
        rtype: 0,
        rurl: null,
        mst: 9,
        cp: 0,
        mv: 0,
        publishTime: 1443283200007,
        privilege: {
        id: 35040812,
        fee: 0,
        payed: 0,
        st: 0,
        pl: 128000,
        dl: 128000,
        sp: 7,
        cp: 1,
        subp: 1,
        cs: false,
        maxbr: 128000,
        fl: 128000,
        toast: false,
        flag: 128,
        preSell: false
        }
        }
        ],
        relatedInfo: null,
        videoUserLiveInfo: null,
        vid: "F73B74737F6B320719C9C5B7020F4F1B",
        durationms: 243925,
        playTime: 416261,
        praisedCount: 2981,
        praised: false,
        subscribed: false
        }
        }
    ];
    let videoList = this.data.videoList;
    // 将视频列表最新的数据更新到原有视频列表数据中
    videoList.push(...newVideoList);
    this.setData({
      videoList
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
    console.log("页面的下拉刷新");
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("页面的上拉触底");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
    console.log(from);
    if (from=== 'button') {
      return{
        title:"来自button的转发",
        page:"/pages/video/video"
      }
    }else{
      return{
        title:"来自menu的转发",
        page:"/pages/video/video"
      }
    }

  }
})