//=========
// Colors
//=========

export default class Colors {
  static get_hsv(hex_h, hex_s, hex_v) {
    // 入力したhsvからrgbに変換したものが返ってくる
    // 0 <= h <= 1 色相
    // 0 <= s <= 1 彩度
    // 0 <= v <= 1 明度
    
    let h = hex_h / 255
    let s = hex_s / 255
    let v = hex_v / 255
    
    const rgb = Colors.get_rgb(h)
    
    const max = rgb.reduce((a, b) => Math.max(a, b), 0)
    const hs  = rgb.map((e) => e + Math.round((max - e) * (1 - s)))
    
    const hsv = hs.map((e) => Math.round(e * v))
    return Colors.to_hex(hsv)
  }
  
  static get_hsl(hex_h, hex_s, hex_l) {
    // 入力したhslからrgbに変換したものが返ってくる
    // 0 <= h <= 1 色相
    // 0 <= s <= 1 彩度
    // 0 <= l <= 1 輝度
    
    let h = hex_h / 255
    let s = hex_s / 255
    let l = hex_l / 255
    
    const rgb = Colors.get_rgb(h)
    
    const max = rgb.reduce((a, b) => Math.max(a, b), 0)
    const min = rgb.reduce((a, b) => Math.min(a, b), 1)
    const average = min + (max - min) / 2
    const hs  = rgb.map((e) => e + (average - e) * (1 - s))
    
    const disorder = hs.map((e) => e + Math.round(255 * (2 * l - 1)))
    const hsl = disorder.map((e) => Math.min(Math.max(e, 0), 255))
    return Colors.to_hex(hsl)
  }
  
  static get_rgb(alpha) {
    const rgb = (x, a) => {
      const rgb1 = (x + a) % 1
      const rgb2 = Math.abs(6 * (rgb1 - 1 / 2)) - 1
      const rgb3 = Math.min(Math.max(rgb2, 0), 1)
      return rgb3
    }
    const RGB = [rgb(alpha, 0) , rgb(alpha, 2 / 3), rgb(alpha, 1 / 3)]
    return RGB.map((e) => Math.round(e * 255))
  }
  
  static to_hex(color) {
    const r = color[0].toString(16).padStart(2, '0')
    const g = color[1].toString(16).padStart(2, '0')
    const b = color[2].toString(16).padStart(2, '0')
    
    return `#${ r }${ g }${ b }`
  }
}