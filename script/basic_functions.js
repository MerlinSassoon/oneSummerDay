const START_SCENE = "蒙德城";      // 初始场景
let sceneRoad = [START_SCENE, ];  // 路径栈
let currentPointer = 0;           // 起始指针
let fileCache = {};               // 场景缓存
let sceneIndex = null;            // 场景索引预载

// 加载图片作为图标，arr_icon是一个列表，输入元素；id_parent用来选择父元素；class_name用来动态添加CSS样式；
function IconGeneration(arr_icon, id_parent, class_name){
  var oIcons = document.getElementById(id_parent)
  for(var i=0; i < arr_icon.length; i++){
    var oIcon = document.createElement("img");

    oIcon.src = "图片素材/" + arr_icon[i] + ".png";
    oIcon.className = class_name;
    oIcons.appendChild(oIcon);
  }
}


//加载场景索引，挂载本地全局
async function loadIndex(){
    const response = await fetch("文本素材/场景.json");
    sceneIndex = await response.json()
}
// 加载场景
async function loadMainText(sceneName, ){
  // 选择并清空主文本区
  var oMainTextarea = document.getElementById("主文本区");
  oMainTextarea.replaceChildren();
  // 通过场景索引和场景名得到场景路径，并捕获错误
  const sceneInfo = sceneIndex[sceneName]
  if (!sceneInfo) {
    console.error(`找不到场景: ${sceneName}`);
    alert(`错误：场景"${sceneName}"不存在`);
    return;
  }
  const filePath = sceneIndex.base_path + sceneInfo.file
  // 通过缓存机制加载场景
  try{
    // 缓存机制
    if(!fileCache[filePath]){
      console.log('🔄 加载文件:', filePath);
      const response = await fetch(filePath);
      fileCache[filePath] = await response.json();
    }else{
      console.log('⚡ 使用缓存:', filePath);
    }
    // 加载场景
    const mytext = fileCache[filePath];
    const sceneData = mytext[sceneInfo.key]

    if(sceneData.descript){
      for(var i=0; i < sceneData.descript.length ; i++){
        var oDescript = document.createElement("p");
        oDescript.innerText = sceneData.descript[i];
        oDescript.className = "主文本";
        oMainTextarea.appendChild(oDescript);
      }
    }

    // 前往本场景有道路连接的位置
    loadRoadButton(oMainTextarea, sceneData.road);
    // 回头机制：在Road上滑动，并且Road不改变，绑定至按键事件

    console.log("数据加载成功", mytext);
  }catch(error){
    console.log("出现错误：", error);
    alert('加载文内容失败，请检查控制台。');
  }
}



//加载新场景按钮，前往本场景有道路连接的位置
function loadRoadButton(oFather, arr_roads){
  if(arr_roads){
    for(var i=0; i< arr_roads.length; i++){
      var oBtn = document.createElement("input");
      oBtn.type = "button";
      oBtn.value = arr_roads[i];

      oBtn.onclick = function(){
        // 如果不在栈末尾，就截断
        if(currentPointer < sceneRoad.length - 1){
          sceneRoad = sceneRoad.slice(0, currentPointer+1)
        }
        // 压入新场景,场景记忆只有5步
        sceneRoad.push(this.value);
        if(currentPointer >= 4){
          sceneRoad.shift();
        }else{
          currentPointer++;
        }
        // 加载新场景
        loadMainText(this.value);
        console.log("Road", sceneRoad);
      };

      oFather.appendChild(oBtn);
    }
  }
}

document.addEventListener('keydown', loadBack, false);
document.addEventListener('keydown', loadForward, false);

//前进和后退绑到按键事件，用于便捷行动
//加载回头按钮，返回路径上后一个场景
function loadBack(event){
  // 如果有后退的空间，就创建一个后退按钮
  if(currentPointer > 0 && event.key == "ArrowLeft"){
    currentPointer--;
    loadMainText(sceneRoad[currentPointer]);
    console.log("<-：", sceneRoad);
  }
}
//加载前进按钮，返回路径上前一个场景
function loadForward(){
  // 如果有前进的空间，就创建一个前进按钮
  if(currentPointer < sceneRoad.length - 1  && event.key == "ArrowRight"){
    currentPointer++;
    loadMainText(sceneRoad[currentPointer]);
    console.log("->：", sceneRoad);
  }
}