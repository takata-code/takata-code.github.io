//=============
// Project IO
//=============

import P from './project.js'

const module = {}

function blob_to_base64(blob) {
  return new Promise(resolve => {
    const file_reader = new FileReader()
    
    file_reader.onloadend = () => {
      resolve(file_reader.result)
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
  static generate_project_json(project = null) {
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
  static async import_text(text) {
    const lines = text.split('\n')
    const base64 = lines[lines.length - 1]
    try {
      const zip = base64_to_blob(base64)
      try {
        return await module.Importer.import_zip(zip)
      } catch (e) {
        throw e
      }
    } catch {
      throw new Error('プロジェクトテキストの読み込みに失敗しました (Base64 テキストを発見できません)')
    }
  }
  
  static async import_zip(zip_file) {
    try {
      if (!zip_file.name) {
        zip_file.name = 'UnknownProject.zip'
      }
      
      const data = zip_file.arrayBuffer()
      const jszip = new JSZip()
      await jszip.loadAsync(data)
      
      // project_name の決定
      // 1. project_name.tproject が存在した場合は、それとする
      // 2. すべてのファイルが project_name で始まっていれば、それとする
      // 3. ZIP ファイルの名前とする
      let tproject = Object.keys(jszip.files).find(p => p.endsWith('.tproject'))
      let project_name = tproject ? tproject.substr(0, tproject.indexOf('.')) : null
      let has_root_directory = true
      
      const zip_file_name = zip_file.name.match(/^[^\.]+(?=.)/)[0]
      const first_file_first_name = jszip.files[Object.keys(jszip.files)[0]].name.match(/^[^\/]+/)[0]
      
      for (const path in jszip.files) {
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
      const project = new P.Project(project_name)
      
      for (let path in jszip.files) {
        const jszip_file = jszip.files[path]
        
        if (has_root_directory) {
          path = path.replace(`${ project_name }/`, '')
        }
        
        if (jszip_file.dir||true) {
          if (path.length != 0) {
            const directory_match = path.match(/.*\/(?=[^\/]*$)/)
            
            if (directory_match) {
            if (!project.directories.includes(directory_match[0]))
            
              project.directories.push(directory_match[0])
            }
          }
        }
      }
      
      for (let path in jszip.files) {
        const jszip_file = jszip.files[path]
        
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
      
      let project_json = project.files.find(f => f.path.match(/.*\.tproject$/))
      if (!project_json) {
        project_json = new P.File(project_name + '.tproject', new Blob([module.Generator.generate_project_json()]))
        project.add_file(project_json)
        await project_json.load()
      }
      
      project.info = JSON.parse(project_json.text)
      
      return project
    } catch(e) {
      throw e
    }
  }
}

module.Exporter = class {
  static async export_text(project) {
    const zip = await module.Exporter.export_zip(project)
    const base64 = await blob_to_base64(zip)
    
    let text = ''
    text += `${ project.name } v${ project.info.version }` + '\n'
    text += base64
    
    return text
  }
  
  static async export_zip(project){
    const jszip = new JSZip()
    
    for (const folder of project.directories) {
      jszip.folder(folder.substr(0, folder.length - 1))
    }
    
    for (const file of project.files) {
      jszip.file(file.path, file.blob)
    }
    
    let project_zip = await jszip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } })
    return project_zip
  }
}

export default module