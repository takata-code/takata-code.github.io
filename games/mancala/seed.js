export default class Seed {
  constructor(players_number, term, seeds_number) {
    this.players_number = players_number
    this.term = term
    this.seeds_number = seeds_number
    
    this.length = this.term * this.players_number
    
    this.seeds_total = this.players_number * this.seeds_number * (this.term - 1)
    this.stage   = null
    this.present = 0
    this.next    = 1
    
    this.set_stage()
    
  }
  
  // termを周期とする長さterm * playersの配列を作る
  set_stage() {
    this.stage = Array(this.length).fill(this.seeds_number)
    for(let i = 0; i < this.players_number; i++) this.stage[(i + 1) * this.term - 1] = 0
    /*
    for (let i = 0; i < this.term - 1; i++) {
      this.stage[i] =[21,13,8,5,3,2,1,1][i]
    }
    */
  }
  
  // stage[id]から種をまき、返り値はターンの進行の有無
  pick(id) {
    if (!this.is_pickable(id)) return
    
    const stage = this.stage
    const seeds = stage[id]
    const final = id + seeds
    
    const event = this.what_event(id, final)
    stage[id] = 0
    for(let i = 0; i < seeds; i++) stage[(id + i + 1) % (this.term * this.players_number)]++
    
    if(event.can_steal) this.steal_seeds(final)
    if(!event.can_redo) this.shift_turn()
    
    return event
  }
  
  is_pickable(id) {
    // スコア用のポケットは弾く
    if(id % this.term === this.term - 1) return false
    
    // 自分の陣地以外なら弾く
    if(this.get_player_id(id) !== this.present) return false
    
    // 何もないポケットは弾く
    if(this.stage[id] === 0) return false
    
    return true
  }
  
  // 発生するイベントをフラグにしてobjectで返す
  what_event(id, final, present = this.present) {
    final = this.get_clamped_id(final)
    
    const result = {}
    const ower_final = this.get_player_id(final)
    
    result.is_empty = this.stage[id] === 0
    result.is_score  = (id + 1) % this.term === 0
    result.can_redo  = (final + 1) % this.term === 0 && ower_final === present
    result.can_steal = this.stage[final] === 0 && ower_final === present && !result.can_redo
    
    return result
  }
  
  // stage[id]の属するplayerのidを返す
  get_player_id(id) {
    id = this.get_clamped_id(id)
    return Math.floor((id % this.length) / this.term)
  }
  
  get_clamped_id(id) {
    if (0 <= id && id < this.length) return id
    
    const mod = id % this.length
    const clamped = mod >= 0 ? mod : mod + this.length
    return clamped
  }
  
  // stageのidを指定して種を横取り
  steal_seeds(id) {
    const beside_id = this.get_beside(id)
    const stolen    = this.stage[id] + this.stage[beside_id]
    const pocket_id = (this.get_player_id(id) + 1) * this.term - 1
    this.stage[pocket_id] += stolen
    this.stage[id] = 0
    this.stage[beside_id] = 0
  }
  
  // stage[id]に隣接する場所を返す関数
  get_beside(id) {
    if((id + 1) % this.term === 0) return
    const f = (x) => this.term * (Math.floor((x - 2) / this.term + this.players_number - 1) % (this.players_number - 1)) + 2 * this.term - 4
    const g = (x) => -1 * ((x - 2 + this.term) % this.term)
    const h = (x) => -1 * this.term * Math.floor((x - 2) / (this.term * (this.players_number - 1)))
    return f(id) + g(id) + h(id)
  }
  
  // presentを一つずらす
  shift_turn() {
    this.present = (this.present + this.next) % this.players_number
    /*
    let can_put = false
    for(let i = 0; (i < this.term - 1) && !can_put; i++) can_put = this.stage[this.term * this.present + i] > 0
    return can_put
    */
  }
  
  // 終了条件を満たすか返す
  is_finished() {
    return this.stage.every((e, i) => e === 0 || i % this.term === this.term - 1)
  }
}