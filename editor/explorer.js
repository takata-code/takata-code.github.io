//===========
// Explorer
//===========

import P from './project.js'
import Tab from './tab.js'
import DS from './dialog_system.js'
import G from './global.js'
import Animation from './animation.js'

// ファイル操作ダイアログの初期化
async function file_detail_dropdown_open(dom) {
  const i = await DS.dropdown(dom, ['名前を変更', 'ファイルを削除'])
  
  switch (i) {
    case 0:
      const name = await DS.prompt('新しいファイル名を入力:', '', { type: 'file', value: Explorer.selected.name })
    
      if (name) {
        if (G.project.change_file_name(Explorer.selected.path, name)) {
         Explorer.create(G.project)
          Tab.update()
        } else {
          DS.alert(`${ name } は このフォルダ内に既に存在します`, '', { type: 'info' })
        }
      }
      break
    
    case 1:
      const ok = await DS.confirm(`${ Explorer.selected.path } を削除しますか？`, '削除したファイルは元に戻せません', '削除', 'キャンセル')
    
    if (ok) {
      const result = G.project.delete_file(Explorer.selected.path)
      Explorer.create(G.project)
      
      if (!result) {
        DS.alert('正常にファイルを削除できませんでした', '', { type: 'error' })
      }
      
      return
    }
    break
  }
}

async function folder_detail_dropdown_open(dom) {
  const i = await DS.dropdown(dom, ['名前を変更', 'フォルダを削除'])
  
  switch (i) {
    case 0:
      const name = await DS.prompt('新しいフォルダ名を入力:', '', { type: 'folder', value: Explorer.selected.name })
      
      if (name) {
        const map = Explorer.get_folder_open_map(G.project)
        delete map[Explorer.selected.path]
        
        if (G.project.change_folder_name(Explorer.selected.path, name)) {
          alert(Explorer.selected.path)
          map[Explorer.selected.path] = path_to_dom_map[Explorer.selected.path].open
          Explorer.create(G.project, map)
          Tab.update()
        } else {
          DS.alert(`${ name } は このフォルダ内に既に存在します`, '', { type: 'info' })
        }
        
      }
      
      break
      
    case 1:
      const ok = await DS.confirm(`${ Explorer.selected.path } を削除しますか？`, 'このフォルダの中のファイルと\nフォルダもすべて削除されます。', '削除', 'キャンセル')
      
      if (ok) {
        const result = G.project.delete_folder(Explorer.selected.path)
        Explorer.create(G.project)
        
        if (!result) {
          DS.alert('正常にフォルダを削除できませんでした' + result)
        }
        
        return
      }
      break
  }
}

// アイテム追加ダイアログの初期化
function initialize_add_item_dialog() {
  const add_item = document.getElementById('add_item')
  const dialog = document.getElementById('add_item_dialog')
  const dialog_folder = document.getElementById('add_item_dialog_folder')
  const dialog_new_file = document.getElementById('add_item_dialog_new_file')
  const dialog_load_file = document.getElementById('add_item_dialog_load_file')
  const dialog_load_file_details = document.getElementById('add_item_dialog_load_file_details')
  const dialog_cancel = document.getElementById('add_item_dialog_cancel')
  
  add_item.addEventListener('click', async () => {
    dialog.showModal()
    update_add_item_dialog: {
      dialog_load_file_details.innerText = `${ Explorer.current.length == 0 ? 'ルートフォルダ' : Explorer.current } 内に追加します。`
    }
  })
  
  dialog_folder.addEventListener('click', async () => {
    const name = await DS.prompt('新しいフォルダ名を入力:', (Explorer.current.length == 0 ? 'ルートフォルダ' : Explorer.current) + ' 内に作成します', { type: 'folder' })
    
    if (name) {
      G.project.add_folder(Explorer.current + name + '/')
      Explorer.create(G.project)
      
      dialog.close()
    }
  })
  
  dialog_new_file.addEventListener('click', async () => {
    const name = await DS.prompt('新しいファイル名を入力:', (Explorer.current.length == 0 ? 'ルートフォルダ' : Explorer.current) + ' 内に作成します', { type: 'file' })
    
    if (!name) {
      return
    }
    
    const path = Explorer.current + name
    const file = new P.File(path, new Blob(['']))
    
    if (G.project.add_file(file)) {
      Explorer.create(G.project)
    } else {
      dialog_new_file.click()
      DS.alert(`${ name } は このフォルダ内に既に存在します`, '', { type: 'info' })
    }
  })
  
  dialog_load_file.addEventListener('click', async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.hidden = true
    dialog_load_file.appendChild(input)
    
    input.addEventListener('change', () => {
      const files = input.files
      
      if (files.length == 0) {
        return
      }
      
      const project_files = Array.from(files).map(f => {
        const path = Explorer.current + f.name
        const blob = new Blob([f])
        return new P.File(path, blob)
      })
      
      for (const project_file of project_files) {
        G.project.add_file(project_file)
      }
      
      Explorer.create(G.project)
      
      dialog_load_file.removeChild(input)
    })
    
    input.addEventListener('click', e => {
      e.stopPropagation()
    })
    
    input.click()
  })
  
  dialog_cancel.addEventListener('click', async() => {
    dialog.close()
  })
}
initialize_add_item_dialog()

const explorer = document.getElementById('explorer')
explorer.innerHTML = ''

let selected = null

let path_to_dom_map = {}

export default class Explorer {
  static get selected() {
    return selected
  }
  
  static get current() {
    const is_valid_directory_selected = Explorer.selected && (Explorer.selected != G.project.root)
    if (is_valid_directory_selected) {
      return Explorer.selected.path.replace(/[^\/]+$/, '')
    }
    
    return ''
  }
  
  static clear() {
    path_to_dom_map = {}
    explorer.innerHTML = ''
  }
  
  static create(project, folder_open_map) {
    if (!folder_open_map) {
      folder_open_map = Explorer.get_folder_open_map(project)
    }
    
    Explorer.clear()
    const rows = []
    
    function recursive_explorer_add_children(element, parent_dom) {
      let row
      let action
      
      if (element instanceof P.Directory) {
        const folder = document.createElement('div')
        
        row = document.createElement('div')
        row.style.width = '100%'
        row.className = 'explorer-element-row'
        folder.appendChild(row)
        
        const icon = document.createElement('span')
        icon.innerText = 'keyboard_arrow_rightfolder'
        icon.className = 'explorer-element-icon'
        const is_any_file = project.files.some(f => f.path.startsWith(element.path))
        if (is_any_file || project.root == element) {
          icon.style.fontVariationSettings = `'FILL' 1`
        }
        row.appendChild(icon)
        
        const name_label = document.createElement('span')
        name_label.innerText = element.name
        name_label.className = 'explorer-element-name'
        row.appendChild(name_label)
        
        const content = document.createElement('div')
        content.style.marginLeft = '20px'
        content.style.overflow = 'hidden'
        content.style.borderLeft = '2px solid var(--base-color-l)'
        content.hidden = true
        folder.appendChild(content)
        
        folder.open = false
        folder.selected = false
        
        action = async (skip_animation) => {
          folder.open = !folder.open
          
          icon.innerText = folder.open ? 'keyboard_arrow_downfolder_open' : 'keyboard_arrow_rightfolder'
          content.hidden = false
          
          if (!skip_animation) {
            content.style.height = 'auto'
            const height = Number.parseInt(getComputedStyle(content).height)
            await Animation.direct(a => content.style.height = height * (folder.open ? a : (1 - a)) + 'px', 100)
            content.style.height = 'auto'
          }
          
          content.hidden = !folder.open
        }
        
        if (folder_open_map) {
          if (folder_open_map[element.path] == true) {
            action(true)
          }
        }
        
        folder.className = 'explorer-element'
        
        path_to_dom_map[element.path] = folder
        parent_dom.append(folder)
        
        for (const child of element.children) {
          recursive_explorer_add_children(child, content)
        }
      } else {
        const file = document.createElement('div')
        file.className = 'explorer-element'
        
        row = document.createElement('div')
        row.className = 'explorer-element-row'
        file.appendChild(row)
        
        const icon = document.createElement('span')
        icon.innerText = element.get_icon().char
        icon.style.color = element.get_icon().color
        icon.className = 'explorer-element-icon'
        row.appendChild(icon)
        
        const name_label = document.createElement('div')
        name_label.innerText = element.name
        name_label.className = 'explorer-element-name'
        
        row.appendChild(name_label)
        parent_dom.appendChild(file)
        path_to_dom_map[element.path] = file
        
        action = () => {
          if (element.extension == 'tproject') {
            const tab = Tab.get_tab(project)
            tab.open()
            return
          }
          const tab = Tab.get_tab(element)
          tab.open()
        }
      }
      
      if (project.root == element) {
        row.detail = {}
      } else {
        const detail = document.createElement('div')
        detail.className = 'explorer-element-detail'
        detail.innerText = 'more_horiz'
        detail.hidden = true
        row.appendChild(detail)
        row.detail = detail
        
        function detail_dropdown_open(dom) {
          if (element instanceof P.Directory) {
            folder_detail_dropdown_open(dom)
          } else {
            file_detail_dropdown_open(dom)
          }
        }
        
        row.addEventListener('contextmenu', e => {
          if (!row.selected) {
            return
          }
          
          if (element == project.root) {
            return
          }
          
          detail_dropdown_open(row)
          e.preventDefault()
        })
        
        // '...' ボタン押下時
        detail.addEventListener('click', e => {
          detail_dropdown_open(detail)
          
          e.stopPropagation()
        })
      }
      
      row.addEventListener('click', e => {
        if (row.selected) {
          action()
        } else {
          for (const r of rows) {
            r.selected = false
            r.detail.hidden = true
            r.className = 'explorer-element-row'
          }
          
          row.selected = true
          row.detail.hidden = false
          row.className = 'explorer-element-row-selected explorer-element-row'
          
          selected = element
        }
        
      })
      rows.push(row)
    }
    recursive_explorer_add_children(project.root, explorer)
  }
  
  static get_folder_open_map(project) {
    const map = {}
    
    for (const path in path_to_dom_map) {
      if (path.endsWith('/')) {
        map[path] = path_to_dom_map[path].open
      }
    }
    
    return map
  }
}