//=============
// Project IO
//=============

import P from './project.js'

const module = {}

function blob_to_base64(blob) {
  return new Promise(resolve => {
    const file_reader = new FileReader()
    
    file_reader.onloadend = () => {
      const url = file_reader.result
      const base64 = url.match(/[^,]+$/)[0]
      resolve(base64)
    }
    
    file_reader.readAsDataURL(blob)
  })
}

function base64_to_blob(base64) {
  let bin = atob(base64.split(',')[1])
  
  let buffer = new Uint8Array(bin.length)
  
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i)
  }
  
  let blob = new Blob([buffer.buffer], { type: 'application/zip' })
  return blob
}

module.Generator = class {
  static generate_tproject(project = null) {
    let project_info
    
    if (project) {
      project_info = {
        id: project.info.id,
        version: project.info.version
      }
    } else {
      project_info = {
        id: module.Generator.generate_project_id(),
        version: '0.0.0'
      }
    }
    
    return JSON.stringify(project_info)
  }
  
  static generate_project_id() {
    let id = ''
    for (let i = 0; i < 16; i++) {
      id += '0123456789abcdef'[Math.floor(Math.random() * 16)]
    }
    return id
  }
}

module.Importer = class {
  static async import_text(text, option = {}) {
    const lines = text.split('\n')
    const base64 = 'data:application/zip;base64,' + lines[lines.length - 1]
    try {
      const zip = base64_to_blob(base64)
      try {
        return await module.Importer.import_zip(zip, option)
      } catch (e) {
        alert(e)
        throw e
      }
    } catch (e) {
      throw new Error('プロジェクトテキストの読み込みに失敗しました (Base64 テキストを発見できません)' + e)
    }
  }
  
  static async import_zip(zip_file, option = {}) {
    try {
      if (!zip_file.name) {
        zip_file.name = 'UnknownProject.zip'
      }
      
      const data = zip_file.arrayBuffer()
      const jszip = new JSZip()
      await jszip.loadAsync(data)
      
      const files = {}
      for (const path in jszip.files) {
        if (path.includes('__MACOSX')) {
          continue
        }
        
        if (option.generate_tproject && path.endsWith('.tproject')) {
          continue
        }
        
        files[path] = jszip.files[path]
      }
      
      // project_name の決定
      // 1. project_name.tproject が存在した場合は、それとする
      // 2. すべてのファイルが project_name で始まっていれば、それとする
      // 3. ZIP ファイルの名前とする
      let tproject = Object.keys(files).find(p => p.endsWith('.tproject'))
      let project_name = tproject ? tproject.substr(0, tproject.indexOf('.')) : null
      let has_root_directory = true
      
      const zip_file_name = zip_file.name.match(/^[^\.]+(?=.)/)[0]
      const first_file_first_name = Object.keys(files).length == 0 ? null : files[Object.keys(files)[0]].name.match(/^[^\/]+/)[0]
      
      for (const path in files) {
        if (path.substr(0, first_file_first_name.length) != first_file_first_name) {
          has_root_directory = false
        }
      }
      
      if (!project_name) {
        if (first_file_first_name == null) {
          project_name = zip_file_name
        } else {
          if (has_root_directory) {
            project_name = first_file_first_name
          } else {
            project_name = zip_file_name
          }
        }
      }
      
      if (option.name) {
        project_name = option.name
      }
      
      const project = new P.Project(project_name)
      
      for (let path in files) {
        const jszip_file = files[path]
        
        if (has_root_directory) {
          path = path.replace(`${ project_name }/`, '')
        }
        
        if (path.length != 0) {
          const directory_match = path.match(/.*\/(?=[^\/]*$)/)
          
          if (directory_match) {
            let spaces = directory_match[0].split('/')
            spaces = spaces.slice(0, spaces.length - 1)
            
            for (let i = 0; i < spaces.length; i++) {
              const directory = spaces.slice(0, i + 1).join('/') + '/'
            
              if (!project.directories.includes(directory)) {
                project.directories.push(directory)
              }
            }
          }
        }
      }
      
      for (let path in files) {
        const jszip_file = files[path]
        
        if (!jszip_file.dir) {
          const blob = await jszip_file.async('blob')
          
          if (has_root_directory) {
            path = path.replace(`${ project_name }/`, '')
          }
          
          const file = new P.File(path, blob)
          await file.load()
          
          project.add_file(file)
        }
      }
      
      let tproject_file = project.files.find(f => f.path.match(/.*\.tproject$/))
      const new_tproject_needed = tproject_file == null || option.generate_tproject
      
      if (new_tproject_needed) {
        if (tproject_file) {
          project.delete_file(tproject_file.path)
        }
        
        tproject_file = new P.File(project_name + '.tproject', new Blob([module.Generator.generate_tproject()]))
        project.add_file(tproject_file)
        await tproject_file.load()
      }
      
      project.info = JSON.parse(tproject_file.text)
      
      return project
    } catch(e) {
      throw e
    }
  }
}

module.Exporter = class {
  static async export_text(project, options) {
    const zip = await module.Exporter.export_zip(project, options)
    const base64 = await blob_to_base64(zip)
    
    let text = ''
    text += `${ project.name }\nv${ project.info.version }\n`
    text += base64
    
    return text
  }
  
  static async export_zip(project, options){
    const jszip = new JSZip()
    
    for (const folder of project.directories) {
      jszip.folder(folder.substr(0, folder.length - 1))
    }
    
    for (const file of project.files) {
      if (file.path.endsWith('tproject')) {
        if (options.delete_project_info) {
          continue
        }
      }
      
      jszip.file(file.path, file.blob)
    }
    
    let project_zip = await jszip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } })
    return project_zip
  }
}

export default module