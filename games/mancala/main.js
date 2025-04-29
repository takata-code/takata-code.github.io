//-------
// Main
//-------

import Animation from "./animation.js"
import Seed from "./seed.js"

// 定数
const debug = false
const canvas = document.getElementById("canvas")
const canvas_wrapper = document.getElementById('canvas_wrapper')
const margin_ratio = 0.08 // 円の周りに作る余白1辺の幅の割合
const dom_stones = document.getElementById('stones')
const dom_pocket_numbers = document.getElementById('pocket_numbers')
const seeds_number = 4
const resources = {
  stone: null,
  background: null,
  pocket: null,
  pocket_corner: null,
  green_sheet: null,
  board: null
}
const patterns = {
  pocket: null,
  pocket_corner: null,
  green_sheet: null,
  board: null
}

// ゲームごとに変化する変数
let players_number
let term
let player_colors // プレイヤーに固有の色
let seed

// update_canvas() 呼び出し時に更新されるデータ
let canvas_style_width
let canvas_style_height
let canvas_width
let canvas_height
let canvas_size
let ctx = canvas.getContext("2d")
let circles // ポケットの座標と大きさのリスト

// ゲーム中のいろいろな場面で変化する変数
let happen = null // 先行表示データ
let stones_list = [] // 石のDOM要素をポケットごとに保存した2次元リスト
let is_canvas_dblclick_processing = false // 非同期処理のダブり対策のフラグ

main()

// 一度だけ呼び出される
async function main() {
  // Animation の初期化
  Animation.defaultEasing = a => {
    return (-Math.cos(a * Math.PI) + 1) / 2
  }
  
  await initialize_resources()
  initialize_patterns()
  initialize_ui()
}

// title から game へ移る
async function start_game() {
  title_start.style.pointerEvents = "none"
  ranking_to_title.style.pointerEvents = ""
  
  game_wrapper.hidden = false
  
  seed = new Seed(players_number, term, seeds_number)
  player_colors = create_player_colors()
  initialize_canvas()
  initialize_stones()
  initialize_pocket_numbers()
  
  draw()
  
  title_wrapper.style.zIndex = 10000000
  await Animation.direct(a => {
    title_wrapper.style.opacity = `${ 1 - a }`
  }, 500)
  
  title_wrapper.style.opacity = 1
  title_wrapper.style.zIndex = null
  title_wrapper.hidden = true
  
  await show_event_popup(null, "スタート！")
}

function create_player_colors() {
  const array = []
  for (let i = 0; i < players_number; i++) {
    const color = `lch(60% 60% ${ i / players_number * 360 }deg)`
    array.push(color)
  }
  return array
}

async function initialize_resources() {
  function load_image(src) {
    const image = new Image()
    
    return new Promise(resolve => {
      image.onload = () => resolve(image)
      image.src = src
    })
  }
  
  resources.stone = await load_image("resources/stone.png")
  resources.background = await load_image("resources/background.png")
  resources.pocket = await load_image("resources/pocket.png")
  resources.pocket_corner = await load_image("resources/pocket_corner.png")
  resources.green_sheet = await load_image("resources/green_sheet.png")
  resources.board = await load_image("resources/board.png")
}

function initialize_canvas() {
  // リサイズに追従
  window.addEventListener("resize", update_canvas)
  
  // イベントを登録
  canvas.addEventListener("click", on_canvas_click)
  canvas.addEventListener("dblclick", on_canvas_dblclick)
  
  update_canvas()
}

function update_canvas() {
  canvas_style_width = Number.parseFloat(getComputedStyle(canvas).width)
  canvas_style_height = Number.parseFloat(getComputedStyle(canvas).height)
  canvas_width = canvas_style_width * window.devicePixelRatio
  canvas_height = canvas_style_height * window.devicePixelRatio
  canvas_size = Math.min(canvas_width, canvas_height)
  
  canvas.width = canvas_width
  canvas.height = canvas_height
  
  circles = create_circles()
  
  ctx = canvas.getContext("2d")
  ctx.lineJoin = "round"
  
  if (canvas_width > canvas_height) {
    canvas_wrapper.style.width = ''
    canvas_wrapper.style.height = '100%'
  } else {
    canvas_wrapper.style.width = '100%'
    canvas_wrapper.style.height = ''
  }
  
  // canvas_wrapper 内のフォントサイズ設定
  canvas_wrapper.style.fontSize = `${ canvas_size * 0.03 / window.devicePixelRatio }px`
  
  draw()
}

function reset_canvas() {
  window.removeEventListener("resize", update_canvas)
  
  canvas.removeEventListener("click", on_canvas_click)
  
  canvas.removeEventListener("dblclick", on_canvas_dblclick)
}

function initialize_patterns() {
  patterns.pocket = ctx.createPattern(resources.pocket, "repeat")
  patterns.pocket_corner = ctx.createPattern(resources.pocket_corner, "repeat")
  patterns.green_sheet = ctx.createPattern(resources.green_sheet, "repeat")
  patterns.board = ctx.createPattern(resources.board, "repeat")
}

function initialize_ui() {
  title_start.addEventListener("click", () => {
    players_number = Number(title_players_select.value)
    term = Number(title_term_select.value)
    start_game()
  })
  
  pass.addEventListener("click", async () => {
    await show_event_popup(seed.present, "パス")
    
    seed.present = (seed.present + 1) % players_number
    draw()
  })
  
  ranking_to_title.addEventListener("click", () => {
    back_to_title()
  })
}

function initialize_stones() {
  dom_stones.innerHTML = ""
  stones_list = []
  
  for (let i = 0; i < seed.stage.length; i++) {
    const count = seed.stage[i]
    const circle = circles[i]
    
    stones = []
    
    for (let j = 0; j < count; j++) {
      // 石を生成
      const stone = document.createElement("div")
      stone.className = "stone"
      stone.style.width = `${ circle.rradius * 0.4 * 100 }%`
      stone.style.height = `${ circle.rradius * 0.4 * 100 }%`
      
      const image = new Image()
      image.src = "resources/stone.png"
      image.style.filter = `hue-rotate(${ Math.random() * 360 }deg)`
      stone.appendChild(image)
      
      stone.x = get_stone_position(i, count, j).x
      stone.y = get_stone_position(i, count, j).y
      
      stone.update_position = () => {
        stone.style.left = `${ stone.x * 100 }%`
        stone.style.top = `${ stone.y * 100 }%`
      }
      
      stone.update_position()
      
      stones.push(stone)
      dom_stones.appendChild(stone)
    }
    
    stones_list.push(stones)
  }
}

// ポケット横に表示される、石の数を表示するDOM要素を初期化
function initialize_pocket_numbers() {
  dom_pocket_numbers.innerHTML = ""
  
  for (let i = 0; i < circles.length; i++) {
    const c = circles[i]
    
    const pocket_number = document.createElement("div")
    pocket_number.className = "pocket-number"
    pocket_number.style.left = `${ c.rx * 100 }%`
    pocket_number.style.top = `${ (c.ry + c.rradius) * 100 }%`
    pocket_number.style.fontWeight = i % term == term - 1 ? 800 : 600
    dom_pocket_numbers.appendChild(pocket_number)
  }
}

function on_canvas_click(e) {
  // キャンバス座標を取得
  const x = e.offsetX * canvas_width / canvas_style_width
  const y = e.offsetY * canvas_height / canvas_style_height
  
  // 円を探す
  const circle_id = circles.findIndex(c => {
    return ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.radius * 1.2) ** 2)
  })
  
  // 円の外側をクリックした場合は弾く
  if (circle_id == -1) {
    set_happen(null)
    return
  }
  
  // 現在のプレイヤーと異なるプレイヤーのポケットは弾く
  if (seed.get_player_id(circle_id) != seed.present) {
    set_happen(null)
    return
  }
  
  set_stone_info(circle_id)
}

// 先行表示を設定する
function set_stone_info(circle_id) {
  const player_id = seed.get_player_id(circle_id)
  const final     = (circle_id + seed.stage[circle_id]) % seed.length
  const stones    = seed.stage[circle_id]
  
  const base = [circle_id, final]
  const beside = seed.get_beside(circle_id)
  
  const display = (text, highlights) => {
    const happen = { player_id }
    happen.highlights = highlights
    happen.status = text
    set_happen(happen)
    
    draw()
  }
  
  const event = seed.what_event(circle_id, final, player_id)
  if (event.is_score) return display(`${ player_id + 1 }Pのいまのスコアは ${ stones }pt`, [circle_id])
  if (event.is_empty) return display("ここは選べません", [circle_id])
  if (event.can_redo) return display("蒔きながら、もう一度行動出来ます", base)
  if (event.can_steal) {
    base.push(beside)
    return display("蒔きながら、繋がるマスから横取り", base)
  }
  display(stones + "個を先のマスに一つずつ蒔く", base)
}

function set_happen(h) {
  if (h) {
    if (h.highlights.length == 2) {
      const circle = circles[h.highlights[1]]
      kokomade.style.left = `${ circle.rx * 100 }%`
      kokomade.style.top = `${ circle.ry * 100 }%`
      kokomade.hidden = false
    } else {
      kokomade.hidden = true
    }
    
    happen_message.style.borderColor = `${ player_colors[h.player_id] }`
    happen_message_label.innerText = h.status
    happen_message.hidden = false
  } else {
    kokomade.hidden = true
    happen_message.hidden = true
  }
  
  happen = h
  
  draw()
}

async function on_canvas_dblclick(e) {
  if (is_canvas_dblclick_processing) return
  
  is_canvas_dblclick_processing = true
  
  // キャンバス座標を取得
  const x = e.offsetX * canvas_width / canvas_style_width
  const y = e.offsetY * canvas_height / canvas_style_height
  
  // 円を探す
  const circle_index = circles.findIndex(c => {
    return ((x - c.x) ** 2 + (y - c.y) ** 2 < c.radius ** 2)
  })
  
  // 円の外側をクリックした場合は弾く
  if (circle_index != -1)  {
    if (seed.is_pickable(circle_index)) {
      set_happen(null)
      draw()
      await pick(circle_index)
    }
  }
  
  is_canvas_dblclick_processing = false
}

// circle_index から石をまく
async function pick(pick_index) {
  // アニメーションのための情報を先に取得
  const present = seed.present
  const start = pick_index + 1 // 石をまき始める場所
  const length = seed.stage[pick_index]
  const final = start + length - 1 // 石をまき終わる場所
  
  // 石を真ん中に移動
  const center_stones = await move_stones_to_center(stones_list[pick_index])
  stones_list[pick_index] = []
  
  // 石をそれぞれの場所に移動
  await put_center_stones_in_each_place(center_stones, start, length)
  
  // データ上で石をまく
  const result = seed.pick(pick_index)
  
  // seed を更新したら画面も更新
  draw()
  
  // もう1度できるとき
  if (result.can_redo) {
    await show_event_popup(seed.present, "もう一度")
  }
  
  // 横取りするとき
  if (result.can_steal) {
    await steal(present, final)
  }
  
  // この時点で、DOMデータと seed データ間に矛盾がないかチェック (念のため)
  for (let i = 0; i < seed.stage.length; i++) {
    if (stones_list[i].length != seed.stage[i]) {
      if (debug) {
        alert("DOM と seed データに矛盾を発見")
        alert(`${ i }番目で DOM: ${ stones_list[i].length }, seed: ${ seed.stage[i] }`)
      }
      throw new Error("DOM と seed データに矛盾を発見")
    }
  }
  
  // 勝手にパスする仕組み
  function get_pass_required() {
    const p = seed.present
    
    // 手持ちの石がない？
    let is_stones_zero = true
    
    for (let i = p * term; i < (p + 1) * term - 1; i++) {
      if (seed.stage[i] != 0) {
        is_stones_zero = false
      }
    }
    
    return is_stones_zero
  }
  
  // 決着がついた？
  if (seed.is_finished()) {
    await end_game()
  } else {
    // パスできる間、パスし続ける
    while (get_pass_required()) {
      await show_event_popup(seed.present, "パス", "動かせる石がありません")
      
      seed.present = (seed.present + 1) % players_number
      draw()
    }
  }
}

async function move_stones_to_center(stones) {
  const promises = []
  
  for (let i = 0; i < stones.length; i++) {
    const stone = stones[i]
    
    const sx = stone.x
    const sy = stone.y
    
    const rp = get_stone_relative_position(stones.length, i)
    
    const dx = 0.5 + rp.x - sx
    const dy = 0.5 + rp.y - sy
    
    promises.push(Animation.direct(a => {
      stone.x = sx + dx * a
      stone.y = sy + dy * a
      stone.update_position()
    }, 250))
    
    await Animation.sleep(100)
  }
  
  await Promise.all(promises)
  
  return stones
}

async function put_center_stones_in_each_place(stones, start, length) {
  // それぞれの石をポケットに動かすループ
  for (let i = 0; i < length; i++) {
    const stone = stones[i]
    const index = (start + i) % seed.stage.length // 移動するポケットの位置
    const count = seed.stage[index] // 移動するポケットに入っていた石の数
    
    const promises = []
    
    // 他の石にも1つ分のスペースを開けてもらう
    promises.push(change_layout_of_pocket(index, count + 1))
    
    // stone を index 番目のポケットに移動する
    const sx = stone.x
    const sy = stone.y
    const ex = get_stone_position(index, count + 1, count).x
    const ey = get_stone_position(index, count + 1, count).y
    
    promises.push(Animation.direct(a => {
      stone.x = sx + (ex - sx) * a
      stone.y = sy + (ey - sy) * a
      stone.update_position()
    }, 250))
    
    await Promise.all(promises)
    
    // データの更新
    stones_list[index].push(stone)
  }
}

async function put_stones_to_pocket(stones, pocket_index) {
  for (let i = 0; i < stones.length; i++) {
    const stone = stones[i]
    
    const promises = []
    
    const current_stones = stones_list[pocket_index].length
    promises.push(change_layout_of_pocket(pocket_index, current_stones + 1))
    
    // stone を pocket_index 番目のポケットに移動する
    const sx = stone.x
    const sy = stone.y
    const ex = get_stone_position(pocket_index, current_stones + 1, current_stones).x
    const ey = get_stone_position(pocket_index, current_stones + 1, current_stones).y
    
    promises.push(Animation.direct(a => {
      stone.x = sx + (ex - sx) * a
      stone.y = sy + (ey - sy) * a
      stone.update_position()
    }, 250))
    
    await Promise.all(promises)
    
    // データを更新
    stones_list[pocket_index].push(stone)
  }
}

// count 個の石があるものとしてレイアウトする
async function change_layout_of_pocket(pocket_index, count) {
  const promises = []
  
  for (let j = 0; j < stones_list[pocket_index].length; j++) {
    const other_stone = stones_list[pocket_index][j]
    const sx = other_stone.x
    const sy = other_stone.y
    const ex = get_stone_position(pocket_index, count, j).x
    const ey = get_stone_position(pocket_index, count, j).y
    
    promises.push(Animation.direct(a => {
      other_stone.x = sx + (ex - sx) * a
      other_stone.y = sy + (ey - sy) * a
      other_stone.update_position()
    }, 200))
  }
  
  await Promise.all(promises)
}

// present のプレイヤーが index のところから横取りする
async function steal(present, index) {
  const beside = seed.get_beside(index)
  const pocket = (present + 1) * term - 1
  
  // 盗まれる数
  const stolen = stones_list[beside].length
  const stolen_player = seed.get_player_id(beside)
  
  if (stolen > 0) {
    const description = `${ stolen_player + 1 }P から ${ stolen }個の石をうばいます`
    await show_event_popup(present, "横取り！", description)
  }
  
  const stones = [stones_list[index][0]]
  stones.push(...stones_list[beside])
  
  stones_list[index] = []
  stones_list[beside] = []
  
  await move_stones_to_center(stones)
  await put_stones_to_pocket(stones, pocket)
}

async function end_game() {
  await show_event_popup(null, "終了！")
  
  const players_ranking = []
  for (let i = 0; i < players_number; i++) players_ranking.push(i)
  
  const scores = seed.stage.filter((e, i) => i % term === term - 1)
  const sorted_scores = scores.toSorted((a, b) => a < b)
  
  players_ranking.sort((a, b) => scores[a] <= scores[b])
  
  for (const row of ranking_rows.children) {
    row.style.height = "0"
  }
  
  // DOMを設定
  ranking_rows.innerHTML = ""
  
  for (let i = 0; i < players_number; i++) {
    const row = document.createElement("div")
    row.className = "ranking-row"
    
    const player = players_ranking[i]
    
    let crown_color = ["#e59936", "#90b8c8", "#c5693c"][i]
    
    // 同点だった場合にクラウンの色を揃える
    for (let j = i - 1; j >= 0; j--) {
      if (sorted_scores[i] == sorted_scores[j]) {
        crown_color = ["#e59936", "#90b8c8", "#c5693c"][j]
      }
    }
    
    const crown = document.createElement("div")
    crown.className = "ranking-crown"
    crown.innerText = crown_color == null ? "" : "crown"
    crown.style.color = crown_color
    row.appendChild(crown)
    
    const icon = document.createElement("div")
    icon.className = "ranking-icon"
    icon.style.background = player_colors[player]
    row.appendChild(icon)
    
    const label = document.createElement("div")
    label.className = "ranking-label"
    label.innerText = `${ player + 1 }P`
    row.appendChild(label)
    
    const points = document.createElement("div")
    points.className = "ranking-points"
    points.innerText = scores[player]
    row.appendChild(points)
    
    ranking_rows.appendChild(row)
  }
  
  ranking.hidden = false
  
  await Animation.direct(a => {
    ranking.style.opacity = a
  }, 500)
}

async function back_to_title() {
  ranking_to_title.pointerEvents = "none"
  
  title_wrapper.hidden = false
  
  game_wrapper.style.zIndex = 10000000
  await Animation.direct(a => {
    game_wrapper.style.opacity = `${ 1 - a }`
  }, 500)
  
  game_wrapper.style.opacity = 1
  game_wrapper.style.zIndex = null
  game_wrapper.hidden = true
  
  ranking.hidden = true
  title_start.style.pointerEvents = ""
  reset_canvas()
}

function draw() {
  // DOM要素を更新
  present.style.borderColor = player_colors[seed.present]
  present_icon.style.background = player_colors[seed.present]
  present_label.innerText = seed.present + 1 + "Pのターン"

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(resources.background, 0, 0, canvas.width, canvas.height)
  
  // 土台を描画
  ctx.fillStyle = patterns.board
  ctx.strokeStyle = patterns.board
  ctx.lineWidth = get_radius() * 3
  ctx.beginPath()
  
  let corner_points
  if (players_number == 2) {
    const left = circles[circles.length - 1].x
    const top = circles[0].y
    const right = circles[term - 1].x
    const bottom = circles[term].y
    
    corner_points = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }]
  } else {
    corner_points = circles.filter((c, i) => (i + 1) % term == 0)
  }
  
  for (const point of corner_points) {
    ctx.lineTo(point.x, point.y)
  }
  
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  if (happen) {
    draw_beside_line(happen.highlights[0])
  }
  
  /*
  // 先行評価を表示
  if (happen) { 
    const text_length = happen.status.length
    ctx.font = `bold ${ canvas_height * 0.05 }px Noto Sans JP`
    ctx.fillStyle = '#000000'
    ctx.strokeStyle = '#ffffff80'
    ctx.lineWidth = 1.3
    
    ctx.strokeText(happen.status, canvas_width * 0.3, canvas_height * 0.07)
    ctx.fillText(happen.status, canvas_width * 0.3, canvas_height * 0.07)
    
    ctx.strokeStyle = player_colors[happen.player_id]
    
    ctx.lineWidth = 4
    
    ctx.beginPath()
    ctx.moveTo(canvas_width * 0.3, canvas_height * 0.08)
    ctx.lineTo(canvas_width * 0.3 + text_length * canvas_height * 0.05, canvas_height * 0.08)
    ctx.stroke()
  }
  */
  
  for (let i = 0; i < seed.stage.length; i++) {
    const circle = circles[i]
    const player_index = Math.floor(i / term)
    
    const is_highlighted = happen ? happen.highlights.some(e => e === i) : false
    
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.radius * 0.9, 0, Math.PI * 2)
    
    // ポケットの背景を描画
    ctx.fillStyle = i % term == term - 1 ? patterns.pocket_corner : patterns.pocket
    ctx.fill()
    
    // ポケットの陰影を radialGradient を使って描画
    const pocket_gradient = ctx.createRadialGradient(circle.x, circle.y, circle.radius * 0.3, circle.x, circle.y, circle.radius)
    pocket_gradient.addColorStop(0, "#4f231000")
    pocket_gradient.addColorStop(1, "#4f231080")
    ctx.fillStyle = pocket_gradient
    ctx.fill()
    
    if (is_highlighted) {
      ctx.strokeStyle = "#ffffff88"
      ctx.lineWidth = circle.radius * 0.35
      ctx.stroke()
    }
    
    ctx.strokeStyle = "#00000088"
    ctx.lineWidth = circle.radius * 0.15
    ctx.stroke()
    
    // プレイヤーの色の枠線を描画
    ctx.strokeStyle = player_colors[player_index]
    ctx.lineWidth = circle.radius * 0.1
    ctx.stroke()
    
    // 石の数を更新
    if (dom_pocket_numbers.children.length != 0) {
      dom_pocket_numbers.children[i].innerText = seed.stage[i] || ""
    }
    
    // マスのインデックスを描画 (デバッグ用)
    if (debug) {
      ctx.font = `${ circle.radius }px monospace`
      ctx.fillStyle = '#00000030'
      ctx.fillText(i, circle.x - ctx.measureText(i).width / 2, circle.y + circle.radius / 2)
    }
  }
}

// player_index のプレイヤーが横取りできるorされる線を描画する
function draw_beside_line(pocket_id) {
  ctx.strokeStyle = '#00000088'
  
  for (let i = 0; i < seed.stage.length; i++) {
    const beside = seed.get_beside(i)
    
    if (i == pocket_id) {
      // 横取りするとき
      ctx.lineWidth = get_radius() * 0.1
      ctx.setLineDash([])
    } else if (beside == pocket_id) {
      // 横取りされるとき
      ctx.lineWidth = get_radius() * 0.05
      ctx.setLineDash([5, 8])
    } else {
      continue
    }
    
    const a = circles[i]
    const b = circles[beside]
    
    if (!a || !b) continue
    
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
}

/*
// player_index のプレイヤーが横取りできるorされる線を描画する
function draw_beside_lines(player_index) {
  ctx.strokeStyle = '#00000088'
  
  for (let i = 0; i < seed.stage.length; i++) {
    const beside = seed.get_beside(i)
    
    if (seed.get_player_id(i) == player_index) {
      // 横取りするとき
      ctx.lineWidth = get_radius() * 0.1
      ctx.setLineDash([])
    } else if (seed.get_player_id(beside) == player_index) {
      // 横取りされるとき
      
      // 今はとりあえず、横取りされる線は書かない
      continue
      
      
      ctx.lineWidth = get_radius() * 0.5
      ctx.setLineDash([5, 8])
      
    } else {
      continue
    }
    
    const a = circles[i]
    const b = circles[beside]
    
    if (!a || !b) continue
    
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
}
*/

function create_circles() {
  const normalized_points = []
  
  // y座標の最大と最小を検索し、それに合わせて余白部分を調整する
  let min_y = Infinity
  let max_y = -Infinity
    
  for (let i = 0; i < seed.stage.length; i++) {
    // この point の座標は 0から1の範囲に正規化されている
    const normalized_point = get_normalized_point(i)
    normalized_points.push(normalized_point)
    
    min_y = Math.min(min_y, normalized_point.y)
    max_y = Math.max(max_y, normalized_point.y)
  }
  
  // ずらし量を算出
  const gap_y = ((1 - max_y) - min_y) / 2
  
  const circles = []
  
  for (const np of normalized_points) {
    // 0から1までの相対量の座標 (主にDOMで使用する)
    let rx = np.x
    let ry = np.y + gap_y
    
    const radius = get_radius()
    const rradius = radius / canvas_size
    
    // 2人のときは個別に編集
    if (players_number == 2) {
      // 右に90度回転させる
      [rx, ry] = [ry, rx]
      
      const index = normalized_points.indexOf(np)
      
      const player = seed.get_player_id(index)
      
      if (index % term != term - 1) {
        // 上下にマスを離す
        ry += (player - 0.5) * 2 * rradius * 2
      }
    }
    
    const square_x = rx * canvas_size
    const square_y = ry * canvas_size
    
    const x = square_x + (canvas_width - canvas_size) / 2
    const y = square_y + (canvas_height - canvas_size) / 2
    
    circles.push({
      x, y, rx, ry, radius, rradius
    })
  }
  
  return circles
}

function get_radius() {
  // 穴の半径は、(1, 0) とそれを (2PI / players) ラジアン
  // 回した点との距離を、(1 / 2) * (1 / term) * (1 / 2) * canvas_width 倍して求める
  // 最後に、余白部分を考慮して縮小する
  
  const ax = 1
  const ay = 0
  const bx = Math.cos(Math.PI * 2 / players_number)
  const by = Math.sin(Math.PI * 2 / players_number)
  
  const distance = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
  const radius = distance / term / 4 * canvas_size * (1 - margin_ratio * 2)
  
  return radius
}

function get_stone_position(circle_index, count, i) {
  const circle = circles[circle_index]
  const direction = get_stone_relative_position(count, i)
  
  return {
    x: circle.rx + direction.x,
    y: circle.ry + direction.y
  }
}

function get_stone_relative_position(count, i) {
  // TODO 半径の取得の方法
  const rradius = circles[0].rradius
  
  let x, y
  
  if (count < 5) {
    x = (i % 2 == 0 ? -1 : 1) * rradius * 0.3
    y = (i - (count - 1) / 2) / count * rradius
  } else {
    x = (i % 3 - 1) * rradius * 0.3
    y = (i - (count - 1) / 2) / count * rradius
  }
  
  return { x, y }
}

function get_normalized_point(i) {
  // 時計回りにして、1シフトさせる
  i = seed.stage.length - i - 1
  
  const before = Math.floor(i / term)
  const after  = (before + 1) % players_number
  const rate = (i % term) / term
  const gap = 2 * Math.PI / players_number
  
  let vector_b, vector_a
  
  if (players_number == 4) {
    const s = 1 / Math.sqrt(2)
    const vertices = [[-s, -s], [s, -s], [s, s], [-s, s]]
    
    vector_b = { x: vertices[before][0], y: vertices[before][1] }
    vector_a = { x: vertices[after][0], y: vertices[after][1] }
  } else {
    vector_b = {
      x: -Math.sin(gap * before),
      y: Math.cos(gap * before)
    }
  
    vector_a = {
      x: -Math.sin(gap * after),
      y: Math.cos(gap * after)
    }
  }
  
  const vector_ba = {
    x: vector_a.x - vector_b.x,
    y: vector_a.y - vector_b.y
  }
  
  const point_signed = {
    x: vector_b.x + vector_ba.x * rate,
    y: vector_b.y + vector_ba.y * rate
  }
  
  // 余白を設ける
  point_signed.x *= 1 - margin_ratio * 2
  point_signed.y *= 1 - margin_ratio * 2
  
  const point_normalized = {
    x: (point_signed.x + 1) / 2,
    y: 1 - (point_signed.y + 1) / 2
  }
  
  return point_normalized
}

async function show_event_popup(player_id, text, description = "") {
  event_popup.hidden = false
  event_popup_icon.hidden = player_id == null
  
  if (player_id != null) {
    event_popup_icon.style.background = player_colors[player_id]
  }
  event_popup_label.innerText = text
  event_popup_description.innerText = description
  
  await Animation.direct(a => {
    event_popup_content.style.transform = `scale(${ 1.5 - a * 0.5 })`
    event_popup.style.opacity = a
  }, 300)
  
  await Animation.sleep(800)
  
  await Animation.direct(a => {
    event_popup_content.style.transform = `scale(${ 1 + a * 0.5 })`
    event_popup.style.opacity = 1 - a
  }, 300)
  
  event_popup.hidden = true
}
