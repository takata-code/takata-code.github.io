//=======
// Main
//=======

import P from './project.js'
import PIO from './project_io.js'
import Tab from './tab.js'
import Explorer from './explorer.js'
import DS from './dialog_system.js'
import Animation from './animation.js'
import G from './global.js'

const reset_local_storage = false
const contextmenu_enabled = true

if (reset_local_storage) {
  localStorage.clear()
}

if (!contextmenu_enabled) {
  oncontextmenu = () => false
}

function initialize_window() {
  document.addEventListener('touchmove', e => {
    e.preventDefault()
  }, {
    passive: false
  })
}
initialize_window()

function load_project(project) {
  Tab.clear()
  Explorer.clear()
  
  Explorer.create(project)
  G.project = project
}

async function save_project_data_to_local_storage() {
  const project_data = await PIO.Exporter.export_text(G.project)
  const json = JSON.stringify({
    project_name: G.project.name,
    project_data
  })
  localStorage.setItem('project_' + G.project.info.id, json)
  localStorage.setItem('project_last_id', G.project.info.id)
}

function create_temp_data() {
  const tabs = Tabs.get_all_tabs()
  const temp_tabs = tabs.map(elem => elem.target.path)
  
  return {
    tabs: temp_tabs
  }
}

function initialize_new_project_dialog() {
  const dialog = document.getElementById('new_project_dialog')
  const templetes = document.getElementById('new_project_dialog_templetes')
  const cancel = document.getElementById('new_project_dialog_cancel')
  
  for (const templete of templetes.children) {
    templete.addEventListener('click', async () => {
      const index = Array.from(templetes.children).indexOf(templete)
      dialog.calceled = false
      dialog.close()
      const name = await DS.prompt('プロジェクト名を入力:', '', { value: 'Project', type: 'folder' })
      if (name) {
        const templetes_json_response = await fetch('templetes.json')
        const templetes_json = await templetes_json_response.json()
        const project_text = templetes_json[index].data
        const project = await PIO.Importer.import_text(project_text, { name: name, generate_tproject: true })
        project.name = name
        
        load_project(project)
        
        return
      }
      
      dialog.showModal()
    })
  }
  
  cancel.addEventListener('click', () => {
    dialog.calceled = true
    dialog.close()
  })
}
initialize_new_project_dialog()

function initialize_welcome_dialog() {
  const dialog = document.getElementById('welcome_dialog')
  const open_last = document.getElementById('welcome_dialog_open_last')
  const make_new = document.getElementById('welcome_dialog_new')
  const open_proj = document.getElementById('welcome_dialog_open')
  
  const menu_load_dialog = document.getElementById('menu_load_dialog')
  
  const new_project_dialog = document.getElementById('new_project_dialog')
  
  make_new.addEventListener('click', async () => {
    new_project_dialog.showModal()
    //load_project(new P.Project('Project'))
    dialog.close()
  })
  
  new_project_dialog.addEventListener('close', () => {
    if (dialog.calceled) {
      dialog.showModal()
    }
  })
  
  open_proj.addEventListener('click', async () => {
    dialog.close()
    menu_load_dialog.showModal()
    menu_load_dialog.parent = 'welcome'
    menu_load_dialog.last_project = G.project
  })
  
  menu_load_dialog.addEventListener('close', () => {
    if (menu_load_dialog.parent == 'welcome') {
      if (menu_load_dialog.last_project == G.project) {
        dialog.showModal()
      }
    }
  })
}
initialize_welcome_dialog()

function update_welcome_dialog() {
  const dialog = document.getElementById('welcome_dialog')
  const open_last = document.getElementById('welcome_dialog_open_last')
  const open_last_title = document.getElementById('welcome_dialog_open_last_title')
  
  const last_key = localStorage.getItem('project_last_id')
  const project_json = localStorage.getItem('project_' + last_key)
  
  open_last.hidden = true
  
  if (project_json) {
    const project_obj = JSON.parse(project_json)
    const project_name = project_obj.project_name
    
    open_last_title.innerText = `プロジェクト ${ project_name } を続行`
    const text = project_obj.project_data
    open_last.hidden = false
    
    open_last.onclick = async () => {
      load_project(await PIO.Importer.import_text(text))
      dialog.close()
    }
  }
}

// explorer, footer の折りたたみ機能
function initialize_explorer_and_footer_fold() {
  // expolrer の折りたたみ
  const explorer_fold = document.getElementById('explorer_fold')
  const explorer_open_width = Number(getComputedStyle(document.body).getPropertyValue('--explorer-width').replace('px', ''))
  explorer_fold.open = true
  
  explorer_fold.addEventListener('click', () => {
    explorer_fold.open = !explorer_fold.open
    const a = explorer_fold.open ? 0 : explorer_open_width
    const b = explorer_fold.open ? explorer_open_width : 0
    
    Animation.direct(x => {
      document.body.style.setProperty('--explorer-width', (a + (b - a) * x) + 'px')
    }, 100)
  })
  
  // footer の折りたたみ
  const footer_fold = document.getElementById('footer_fold')
  const footer_max_height = Number(getComputedStyle(document.body).getPropertyValue('--footer-max-height').replace('px', ''))
  const footer_min_height = Number(getComputedStyle(document.body).getPropertyValue('--footer-min-height').replace('px', ''))
  footer_fold.open = true
  
  footer_fold.addEventListener('click', () => {
    footer_fold.open = !footer_fold.open
    
    const a = footer_fold.open ? footer_min_height : footer_max_height
    const b = footer_fold.open ? footer_max_height : footer_min_height
    
    Animation.direct(x => {
      document.body.style.setProperty('--footer-height', (a + (b - a) * x) + 'px')
    }, 100)
  })
  
}
initialize_explorer_and_footer_fold()

function initialize_menu_undo_redo() {
  const menu_undo = document.getElementById('menu_undo')
  const menu_redo = document.getElementById('menu_redo')
  
  menu_undo.addEventListener('click', () => {
    Tab.undo()
  })
  
  menu_redo.addEventListener('click', () => {
    Tab.redo()
  })
}
initialize_menu_undo_redo()

function initialize_menu_save_and_save_all() {
  const menu_save = document.getElementById('menu_save')
  const menu_save_all = document.getElementById('menu_save_all')
  
  menu_save.addEventListener('click', () => {
    const tab = Tab.get_active_tab()
    
    if (tab) {
      tab.save()
    }
    
    save_project_data_to_local_storage()
  })
  
  menu_save_all.addEventListener('click', () => {
    for (const tab of Tab.get_all_tabs()) {
      tab.save()
    }
    
    save_project_data_to_local_storage()
  })
}
initialize_menu_save_and_save_all()

// menu_load の処理
function initialize_menu_load() {
  const menu_load = document.getElementById('menu_load')
  const menu_load_dialog = document.getElementById('menu_load_dialog')
  const menu_load_dialog_text = document.getElementById('menu_load_dialog_text')
  const menu_load_dialog_zip = document.getElementById('menu_load_dialog_zip')
  const menu_load_dialog_zip_label = document.getElementById('menu_load_dialog_zip_label')
  const menu_load_dialog_zip_input = document.getElementById('menu_load_dialog_zip_input')
  const menu_load_dialog_cancel = document.getElementById('menu_load_dialog_cancel')
  
  const menu_load_text_dialog = document.getElementById('menu_load_text_dialog')
  const menu_load_text_dialog_input = document.getElementById('menu_load_text_dialog_input')
  const menu_load_text_dialog_ok = document.getElementById('menu_load_text_dialog_ok')
  const menu_load_text_dialog_back = document.getElementById('menu_load_text_dialog_back')
  
  menu_load.addEventListener('click', () => {
    menu_load_dialog.showModal()
    menu_load_dialog_zip_input.value = null
  })
  
  menu_load_dialog_text.addEventListener('click', async () => {
    try {
      const text = await DS.prompt('プロジェクトテキストをロード', '', { type: 'bigtext' })
      
      if (text == null) {
        return
      }
      
      let project = await PIO.Importer.import_text(text)
      load_project(project)
      menu_load_text_dialog.close()
      menu_load_dialog.close()
    } catch (e) {
      DS.alert('テキストが正しい形式ではありません。', 'プロジェクトの読み込みに失敗しました', { type: 'error' })
    }
  })
  
  menu_load_dialog_zip.addEventListener('click', () => {
    menu_load_dialog_zip_label.click()
  })
  
  menu_load_dialog_zip_input.addEventListener('input', async () => {
    const file = menu_load_dialog_zip_input.files[0]
    
    if (file) {
      try {
        let project = await PIO.Importer.import_zip(file)
        load_project(project)
        menu_load_dialog.close()
      } catch (e) {
        DS.alert('ファイルがZIPアーカイブでないか、破損しています。', 'プロジェクトの読み込みに失敗しました', { type: 'error' })
      }
    }
  })
  
  menu_load_dialog_cancel.addEventListener('click', () => {
    menu_load_dialog.close()
  })
}
initialize_menu_load()


// menu_load の処理
function initialize_menu_download() {
  const menu_download = document.getElementById('menu_download')
  const menu_download_dialog = document.getElementById('menu_download_dialog')
  const menu_download_dialog_project_settings_included = document.getElementById('menu_download_dialog_project_settings_included')
  const menu_download_dialog_temp_data_included = document.getElementById('menu_download_dialog_temp_data_included')
  const menu_download_dialog_zip = document.getElementById('menu_download_dialog_zip')
  const menu_download_dialog_text = document.getElementById('menu_download_dialog_text')
  const menu_download_dialog_cancel = document.getElementById('menu_download_dialog_cancel')
  
  menu_download.addEventListener('click', () => {
    menu_download_dialog.showModal()
  })
  
  menu_download_dialog_zip.addEventListener('click', async () => {
    const zip = await PIO.Exporter.export_zip(G.project)
    const url = URL.createObjectURL(zip)
    
    const a = document.createElement('a')
    a.download = G.project.name
    a.href = url
    a.click()
    
    menu_download_dialog.close()
  })
  
  menu_download_dialog_text.addEventListener('click', async () => {
    const text = await PIO.Exporter.export_text(G.project)
    document.body.focus()
    navigator.clipboard.writeText(text)
    DS.alert('コピーしました')
    menu_download_dialog.close()
  })
  
  menu_download_dialog_cancel.addEventListener('click', () => {
    menu_download_dialog.close()
  })
}
initialize_menu_download()

function initialize_menu_project() {
  const menu_project = document.getElementById('menu_project')
  
  menu_project.addEventListener('click', async () => {
    const i = await DS.dropdown(menu_project, ['名前を変更', 'バージョンを変更', 'IDを再生成'])
    
    switch (i) {
      case 0:
        const name = await DS.prompt('新しいプロジェクト名を入力:', '', { type: 'folder', value: G.project.name })
        G.project.name = name
        Explorer.create(G.project)
        break
      
      case 1:
        const version = await DS.version('バージョンを変更:', G.project.info.version)
        
        if (version) {
          G.project.info.version = version
        }
        
        break
      
      case 2:
        const ok = await DS.confirm('プロジェクトのIDを再生成しますか？', '現在のID: ' + G.project.info.id + '\n\nIDは、ブラウザのローカルストレージにプロジェクトを保存する際の識別子として使用されています。\nこれを変更すると、現在ブラウザ上にあるこのプロジェクトに関するデータは復元できません。', '再生成する', 'キャンセル')
        
        if (ok) {
          const id = PIO.Generator.generate_project_id()
          G.project.info.id = id
          DS.alert('新しいID: ' + id, 'プロジェクトのIDを再生成しました')
        }
        break
    }
  })
}
initialize_menu_project()

function initialize_menu_run() {
  const menu_run = document.getElementById('menu_run')
  const menu_debug = document.getElementById('menu_debug')
  
  menu_run.addEventListener('click', () => {
    const is_debug = menu_debug.checked
    
    try {
      const src = G.project.get_page_src({
        debug: is_debug
      })
      window.open(src)
    } catch {
      DS.alert('実行するには、 index' + '.html を用意してください。', 'ページを構築できません')
    }
  })
}
initialize_menu_run()

function initialize_menu_tools() {
  const menu_tools = document.getElementById('menu_tools')
  
  let keyboard = create_keyboard()
  let keyboard_enabled = false
  
  function create_keyboard() {
    const keyboard = document.createElement('div')
    keyboard.className = 'keyboard'
    const chars = '\'"`=(){}&|$_'
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i]
      const button = document.createElement('button')
      button.innerText = chars[i]
      button.addEventListener('click', () => {
        Tab.input(char)
      })
      keyboard.appendChild(button)
    }
    
    function keyboard_move(move_x, move_y) {
      let style = getComputedStyle(keyboard)
      
      const left = Number.parseFloat(style.left) + move_x
      const top = Number.parseFloat(style.top) + move_y
      
      keyboard.style.left = '0'
      keyboard.style.top = '0'
      style = getComputedStyle(keyboard)
      
      const left_min = 0
      const left_max = window.innerWidth - Number.parseFloat(style.width)
      
      const top_min = 0
      const top_max = window.innerHeight - Number.parseFloat(style.height)
      
      const left_rounded = Math.min(Math.max(left_min, left), left_max)
      const top_rounded = Math.min(Math.max(top_min, top), top_max)
      
      keyboard.style.left = left_rounded + 'px'
      keyboard.style.top = top_rounded + 'px'
    }
    
    window.addEventListener('resize', () => {
      keyboard_move(0, 0)
    })
    
    // マウスイベント対応
    let is_mouse_down = false
    
    keyboard.addEventListener('mousedown', () => {
      is_mouse_down = true
    })
    
    window.addEventListener('mouseup', () => {
      is_mouse_down = false
    })
    
    window.addEventListener('mousemove', e => {
      if (!is_mouse_down) {
        return
      }
      
      keyboard_move(e.movementX, e.movementY)
    })
    
    // タッチイベント対応
    let is_touching = false
    let last_touch_x = 0
    let last_touch_y = 0
    
    keyboard.addEventListener('touchstart', e => {
      is_touching = true
      
      last_touch_x = e.touches[0].pageX
      last_touch_y = e.touches[0].pageY
    })
    
    window.addEventListener('touchup', () => {
      is_touching = false
    })
    
    window.addEventListener('touchmove', e => {
      if (!is_touching) {
        return
      }
      
      const touch_x = e.touches[0].pageX
      const touch_y = e.touches[0].pageY
      
      keyboard_move(touch_x - last_touch_x, touch_y - last_touch_y)
      
      last_touch_x = touch_x
      last_touch_y = touch_y
    })
    
    return keyboard
  }
  
  function show_keyboard() {
    document.body.appendChild(keyboard)
    
    const style = getComputedStyle(keyboard)
    keyboard.style.left = window.innerWidth / 2 - Number.parseFloat(style.width) / 2 + 'px'
    keyboard.style.top = window.innerHeight / 2 - Number.parseFloat(style.height) / 2 + 'px'
    
    keyboard_enabled = true
  }
  
  function hide_keyboard() {
    document.body.removeChild(keyboard)
    keyboard_enabled = false
  }
  
  menu_tools.addEventListener('click', async () => {
    const i = await DS.dropdown(menu_tools, ['カラーパレット', `記号キーボードを${ keyboard_enabled ? '非表示' : '表示' }`])
    
    switch (i) {
      case 0:
        const cp = Tab.get_tab(null, { type: 'colorpalette' })
        cp.open()
        break
      
      case 1:
        if (keyboard_enabled) {
          hide_keyboard()
        } else {
          show_keyboard()
        }
    }
  })
}
initialize_menu_tools()

function initialize() {
  update_welcome_dialog()
  const dialog = document.getElementById('welcome_dialog')
  dialog.showModal()
}
initialize()

