const START_SCENE = "蒙德城";      // 初始场景
let sceneRoad = [START_SCENE, ];  // 路径栈
let currentPointer = 0;           // 起始指针
let fileCache = {};               // 场景缓存
let sceneIndex = null;            // 场景索引预载
let textIndex = null;             //说明索引预载
let isBFDisabled = false;         // 前进后退是否不可用

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


//加载场景索引和说明索引，挂载本地全局
async function loadIndex(){
    const response_scene = await fetch("文本素材/场景索引.json");
    sceneIndex = await response_scene.json();
    const response_text = await fetch("文本素材/说明索引.json");
    textIndex = await response_text.json();
}
// 加载主文本
async function loadMainText(sceneName, ){
  // 通过场景索引和场景名得到场景路径，并捕获错误
  var sceneInfo = sceneIndex[sceneName]
  if (!sceneInfo) {
    sceneInfo = sceneIndex["not_found"];
    console.log(`${sceneName}：前面的区域，以后再来探索吧！`);
  }
  const filePath = sceneIndex.base_path + sceneInfo.file

  // 选择主文本区
  const oMainTextArea = document.getElementById("主文本区");
  // oMainTextArea.replaceChildren();
  // 获得三个子块并清空其中的内容
  const [oMainTextHead, oMainTextContent, oMainTextJump] = Array.from(oMainTextArea.children);
  [oMainTextHead, oMainTextContent, oMainTextJump].forEach(el => el.replaceChildren());

  // 主文本标题区
  var oHeadline = document.createElement('h2');
  oHeadline.innerText = sceneName;
  oHeadline.className = "主文本标题";
  oMainTextHead.appendChild(oHeadline);

  // 主文本内容区和跳转区
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
    const sceneData = mytext[sceneInfo.key];

    if(sceneInfo.key == "战斗"){
      await createMahjongTable(oMainTextContent, oMainTextJump, sceneData); // 手动创建战斗场景和牌桌，json存储的信息作为”统一、样板“存在
    }else{
      // 主文本内容区，分段落加载主文本内容
      if(sceneData.descript){
        for(var i=0; i < sceneData.descript.length ; i++){
          const oDescript = document.createElement("p");
          oDescript.innerHTML = sceneData.descript[i];
          oDescript.className = "主文本内容";
          oMainTextContent.appendChild(oDescript);
        }
      }
    }
    // 主文本跳转区，前往本场景有道路连接的位置
    loadRoadButton(oMainTextJump, sceneData.road);
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
    var oBtnUl = document.createElement("ul");
    oBtnUl.className = "主文本跳转";

    for(var i=0; i< arr_roads.length; i++){
      var oBtnLi = document.createElement("li");
      oBtnLi.innerText = "---"+arr_roads[i]+"---";
      oBtnLi.setAttribute("value", arr_roads[i]);
      oBtnLi.onclick = function(){
        loadScene(this.getAttribute("value"));
      };
      oBtnUl.appendChild(oBtnLi);
    }
    oFather.appendChild(oBtnUl);
  }
}

// 加载场景
async function loadScene(button_value){
  // 如果新场景在本场景路径的附近（前后）,则不压入新场景
  if(currentPointer > 0 && sceneRoad[currentPointer-1] === button_value){
    currentPointer--;
    console.log("<-：", sceneRoad);
  }else if(currentPointer < sceneRoad.length-1 && sceneRoad[currentPointer+1] === button_value){
    currentPointer++;
    console.log("->：", sceneRoad);
  }else{
    // 如果不在栈末尾，就截断
    if(currentPointer < sceneRoad.length - 1){
      sceneRoad = sceneRoad.slice(0, currentPointer+1)
    }
    // 压入新场景,场景记忆只有5步
    sceneRoad.push(button_value);
    if(currentPointer >= 4){
      sceneRoad.shift();
    }else{
      currentPointer++;
    }
  }
  // 加载新场景
  await loadMainText(button_value);
  await loadSubText(["scene_mode", button_value]);
  console.log("newRoad:", button_value);
}

function bindBF(){
  document.addEventListener('keydown', loadBack, false);
  document.addEventListener('keydown', loadForward, false);
}


//前进和后退绑到按键事件，用于便捷行动
//加载回头按钮，返回路径上后一个场景
function loadBack(event){
  // 如果有后退的空间，就创建一个后退按钮
  if(!isBFDisabled){
    if(currentPointer > 0 && event.key == "ArrowLeft"){
      currentPointer--;
      loadMainText(sceneRoad[currentPointer]);
      console.log("<-：", sceneRoad);
    }
  }else{
    console.log("前进后退被禁用");
  }
}
//加载前进按钮，返回路径上前一个场景
function loadForward(){
  // 如果有前进的空间，就创建一个前进按钮
  if(!isBFDisabled){
    if(currentPointer < sceneRoad.length - 1  && event.key == "ArrowRight"){
      currentPointer++;
      loadMainText(sceneRoad[currentPointer]);
      console.log("->：", sceneRoad);
    }
  }else{
    console.log("前进后退被禁用");
  }
}

// 加载副文本区
async function loadSubText(config){
  const [textName, target] = config;
  // 通过场景索引和场景名得到场景路径，并捕获错误
  var textInfo = textIndex[textName]
  if (!textInfo) {
    console.log(`${textName}：未能成功加载`);
    return;
  }
  const filePath = textIndex.base_path + textInfo.file;

  // 选择副文本区
  const oSubTextArea = document.getElementById("副文本区");
  // 获得两个子块并清空其中的内容
  const [oSubTextRule, oSubTextAction] = Array.from(oSubTextArea.children);
  const [oActionHead, oActionContent] = Array.from(oSubTextAction.children);
  //[oMainTextHead, oMainTextContent, oMainTextJump].forEach(el => el.replaceChildren());
  // 规则区清空，行动区持续展示；特殊场景特殊显示

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
    const textData = mytext[textInfo.key].join("</br>");

    if(textData){
      if(textName == "rule_mode"){
        oSubTextRule.replaceChildren();// 注意退出回合时要清空规则区；
        oSubTextRule.innerHTML = textData;
      }else{
        oActions = document.createElement("p");
        oActions.innerText = textData+target;
        oActions.className = "副文本行动内容"
        oActionContent.appendChild(oActions);
      }
    }

    console.log("数据加载成功", textData);
  }catch(error){
    console.log("出现错误：", error);
    alert('加载文内容失败，请检查控制台。');
  }
}

/*"你来到了某某地——委托给加载场景函数",
"你攻击了某某魔物",
"你友好对待某某魔物",
"你采摘/挖掘了某某特产",
"你购买了某某物品",
"你装备了某某武备",
"你烹饪了某某菜品"*/



