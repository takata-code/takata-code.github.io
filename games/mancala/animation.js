//------------
// Animation
//------------

// アニメーション クラス
// 連続的に等間隔で処理を呼び出し、
// さまざまな要素をアニメーションできる
export default class Animation {
  static timescale = 1
  
  id = 0
  
  time = 0
  
  // アニメーションの開始時、1度だけ呼び出される
  initialize() { }
  
  // アニメーションの係数 value で呼び出される
  update(value) { }
  
  completed() { }
  
  // 繰り返しのタイプを指定する
  // restart : はじめからもう一度
  // flap    : 折り返す
  repeatMode = 'restart'
  
  static defaultEasing = a => a
  
  constructor() {
    
  }
  
  // アニメーションをスタート
  // time ミリ秒かけてアニメーション
  start(options) {
    options = options ? options : { }
    
    const easing = options.easing || Animation.defaultEasing
    
    let time = options.time || this.time
    time *= Animation.timescale
    
    this.initialize()
    
    let id = this.id
    
    return new Promise(resolve => {
      const self = this
      const repeats = options.times ? options.times : 1
      let i = 0
      let flap = this.repeatMode == 'flap'
      
      let start_time = performance.now()
      let reverse = false
      function frame_onetime(frame_time) {
        if (id != self.id) {
          resolve()
          self.completed()
          return
        }
        
        if (frame_time - start_time >= time) {
          self.update(reverse ? 0 : 1)
           
          if (++i == repeats) {
            resolve()
            self.completed()
            return
          }
        }
        reverse = flap && i % 2 == 1
        let a = Math.max((frame_time - start_time) / time, 0)
        
        self.update(reverse ? easing(1 - a) : easing(a))
        
        requestAnimationFrame(frame_onetime)
      }
      frame_onetime(start_time)
    })
  }
  
  stop() {
    this.id++
  }
  
  static async direct(update, time, options) {
    let anim = new Animation()
    anim.update = update
    anim.time = time
    await anim.start(options)
  }
  
  static async sleep(time) {
    await Animation.direct(() => {}, time)
  }
}