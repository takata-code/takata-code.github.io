//=======
// Main
//=======

import P from './project.js'
import PIO from './project_io.js'

import Tab from './tab.js'

let main_project = null
let selected_file_or_directory = null

// #汎用的な操作

// ##読み込み関係

function load_project(project) {
  function create_explorer() {
    const explorer = document.getElementById('explorer')
    
    const rows = []
    
    function recursive_explorer_add_children(element, parent_dom) {
      let row
      let action
      
      if (element instanceof P.Directory) {
        const folder = document.createElement('div')
        
        row = document.createElement('div')
        row.style.width = '100%'
        row.className = 'explorer-element-row'
        
        const icon = document.createElement('span')
        icon.innerText = 'keyboard_arrow_rightfolder'
        icon.className = 'explorer-element-icon'
        row.appendChild(icon)
        
        const name_label = document.createElement('span')
        name_label.innerText = element.name
        name_label.className = 'explorer-element-name'
        row.appendChild(name_label)
        
        folder.appendChild(row)
        
        const content = document.createElement('div')
        content.style.marginLeft = '20px'
        content.hidden = true
        folder.appendChild(content)
        
        folder.open = false
        folder.selected = false
        
        action = () => {
          folder.open = !folder.open
          content.hidden = !folder.open
          icon.innerText = folder.open ? 'keyboard_arrow_downfolder_open' : 'keyboard_arrow_rightfolder'
        }
        
        folder.className = 'explorer-element'
        
        parent_dom.append(folder)
        
        for (const child of element.children) {
          recursive_explorer_add_children(child, content)
        }
      } else {
        const file = document.createElement('div')
        file.className = 'explorer-element'
        
        row = document.createElement('div')
        row.className = 'explorer-element-row'
        
        const name_label = document.createElement('div')
        name_label.innerText = element.name
        name_label.className = 'explorer-element-name'
        
        row.appendChild(name_label)
        file.appendChild(row)
        parent_dom.appendChild(file)
        
        action = () => {
          open_file(element)
        }
      }
      
      row.addEventListener('click', () => {
        if (row.selected) {
          action()
        } else {
          for (const r of rows) {
            r.selected = false
            r.className = 'explorer-element-row'
          }
          
          row.selected = true
          row.className = 'explorer-element-row-selected'
          
          selected_file_or_directory = element
        }
      })
      rows.push(row)
    }
    recursive_explorer_add_children(project.root, explorer)
  }
  
  create_explorer()
  main_project = project
}

function open_file(file) {
  const tab = Tab.get_tab(file)
  tab.open()
}

// ##書き出し関係


// explorer, footer の折りたたみ機能
function initialize_explorer_and_footer_fold() {
  // expolrer の折りたたみ
  const explorer_fold = document.getElementById('explorer_fold')
  const explorer_open_width = document.body.style.getPropertyValue('--explorer-width')
  explorer_fold.open = true
  
  explorer_fold.addEventListener('click', () => {
    document.body.style.setProperty('--explorer-width', explorer_fold.open ? '0' : explorer_open_width)
    explorer_fold.open = !explorer_fold.open
  })
  
  // footer の折りたたみ
  const footer_fold = document.getElementById('footer_fold')
  const footer_open_height = document.body.style.getPropertyValue('--footer-height')
  footer_fold.open = true
  
  footer_fold.addEventListener('click', () => {
    document.body.style.setProperty('--footer-height', footer_fold.open ? '0' : footer_open_height)
    footer_fold.open = !footer_fold.open
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

function initialize_menu_save() {
  const menu_save = document.getElementById('menu_save')
  
  menu_save.addEventListener('click', () => {
    for (const tab of Tab.get_all_tabs()) {
      tab.save()
    }
  })
}
initialize_menu_save()

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
  const menu_load_text_dialog_back = document.getElementById('menu_load_text_dialog_back')
  
  menu_load.addEventListener('click', () => {
    menu_load_dialog.showModal()
    menu_load_dialog_zip_input.value = null
  })
  
  menu_load_dialog_text.addEventListener('click', () => {
    menu_load_text_dialog.showModal()
  })
  
  menu_load_dialog_zip.addEventListener('click', () => {
    menu_load_dialog_zip_label.click()
  })
  
  menu_load_dialog_zip_input.addEventListener('change', async () => {
    const file = menu_load_dialog_zip_input.files[0]
    
    if (file) {
      try {
        let project = await PIO.Importer.import_zip(file)
        load_project(project)
        menu_load_dialog.close()
      } catch (e) {
        alert(e)
      }
    }
  })
  
  menu_load_dialog_cancel.addEventListener('click', () => {
    menu_load_dialog.close()
  })
  
  menu_load_text_dialog_back.addEventListener('click', () => {
    menu_load_text_dialog.close()
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
    const zip = await PIO.Exporter.export_zip(main_project)
    const url = URL.createObjectURL(zip)
    
    const a = document.createElement('a')
    a.download = main_project.name
    a.href = url
    a.click()
    
    menu_download_dialog.close()
  })
  
  menu_download_dialog_text.addEventListener('click', () => {
    navigator.clipboard.writeText('anpanman')
  })
  
  menu_download_dialog_cancel.addEventListener('click', () => {
    menu_download_dialog.close()
  })
}
initialize_menu_download()

function initialize_menu_run() {
  const menu_run = document.getElementById('menu_run')
  const menu_debug = document.getElementById('menu_debug')
  
  menu_run.addEventListener('click', () => {
    const is_debug = menu_debug.checked
    
    /*const w = window.open()
    let iframe = document.createElement('iframe')
    iframe.style.margin    = '0px'
    iframe.style.width     = '100%'
    iframe.style.height    = '100%'
    iframe.style.position  = 'fixed'
    iframe.style.top       = '0px'
    iframe.style.left      = '0px'
    iframe.style.boxSizing = 'border-box'
    iframe.style.border    = 'none'
    iframe.src = */
    window.open(main_project.get_page_src({
      debug: is_debug
    }))
    
    /*w.document.body.append(iframe)*/
  })
}
initialize_menu_run()



/*

const footer_annotations = document.getElementById('footer_annotations')

function show_annotations() {
const annotations = editor.getSession().getAnnotations()

footer_annotations.innerHTML = ''

let a_texts = []
let a_lines = []
let a_types = []

for (const a of annotations) {
if (!a_texts.includes(a.text)) {
a_texts.push(a.text)
a_lines.push([a.row + 1])
a_types.push(a.type)
} else {
a_lines[a_texts.indexOf(a.text)].push(a.row + 1)
}
}

for (let i = 0; i < a_texts.length; i++) {
const aIcon = document.createElement('span')
aIcon.className = 'a-icon'
switch(a_types[i]) {
case 'error':
aIcon.style.color = '#e01010'
aIcon.innerText = 'error'
break

case 'warning':
aIcon.style.color = '#e0e020'
aIcon.innerText = 'warning'
break

case 'info':
aIcon.style.color = '#42a7f5'
aIcon.innerText = 'info'
break
}
footer_annotations.append(aIcon)

const aText = document.createElement('span')
aText.className = 'a-text'

let lineText = ''

if (a_lines[i].length > 2) {
lineText = '...'
a_lines[i].length = 2
}

lineText = a_lines[i].join() + lineText
aText.innerText = 'Line ' + lineText + ' :  ' + a_texts[i]
footer_annotations.append(aText)
footer_annotations.append(document.createElement('br'))
}
}

function annotations_loop() {
show_annotations()
setTimeout(annotations_loop, 1000)
}

let last_log_id = 0
let is_important = false
function log(text, important) {
if (important) {
is_important = important
} else {
if (is_important) {
return
}
}

status_text.innerText = text

let log_id = ++last_log_id

setTimeout(() => {
if (log_id == last_log_id) {
status_text.innerText = ''
}
if (important) {
is_important = false
}
}, 2400)
}

function sleep(milli) {
return new Promise((resolve) => {
setTimeout(() => {
resolve()
}, milli)
})
}

function main() {
main_project = new Project('WebProject')

let html = PFile.create_document('index' + '.' + 'html', '<!DOCTYPE html>\n<html>\n<head>\n  <title>WebProject</title>\n  <meta charset="utf-8">\n  <link rel="stylesheet" href="style' + '.css">\n</head>\n<body>\n  <h1>WebProject</h1>\n  <script src="main' + '.js"><\/script>\n</body>\n</html>')
let css = PFile.create_document('style' + '.' + 'css', 'body {\n  \n}')
let js = PFile.create_document('main' + '.' + 'js', '//\n// Your Program Name\n//\n\nalert("Hello, World!")')
main_project.files.push(html, css, js)

build_ui()

annotations_loop()
}
*/

