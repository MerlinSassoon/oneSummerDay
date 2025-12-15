// 战斗场景：剪刀石头布和3句真话2句假话
// 先声明出什么，再选择真假话；3真2假
// a：本次我出“布”；b：本次我出“剪刀”；
// 战斗结束前禁用回退（  ）；结束战斗回合时需要去掉主文本内容区的”战斗场景“class

async function bigWorldInteraction(event){
  const target = event.target;

  if(target.tagName != "SPAN"){return;}
  if(target.classList.contains("魔物")){
    // 异步加载战斗场景，创建牌桌
    await loadScene("战斗");
    // 禁用回退
    isBFDisabled = true;
    // 战斗双方入场
    // 把target放入对手场地// oMonster.innerHTML = target.outerHTML;  有隐患，注意安全问题，以及逐渐寻找更好的方案
    oMonsterArea = document.getElementById("对手场地")
    oMonsterArea.innerHTML = target.outerHTML;
    oPlayerArea = document.getElementById("玩家场地")
    oPlayerArea.innerText = "代号：玩家的名字";
    // 开始战斗回合

    console.log("触发了战斗：", target.innerText);
    //combat_monster(target);
  }else if(target.classList.contains("花卉")){
    console.log("采摘了",target.innerText);
  }
}

// 创建牌桌和手牌
async function createMahjongTable(oContent, oJump, combat_scene){
    oContent.className = "战斗场景";
    oJump.className = "战斗选择";

    oContent.innerHTML = combat_scene.descript;
    const [oMonsterArea, oMahjongTable, oPlayerArea] = Array.from(oContent.children);

    // 牌桌上有双方各有5张牌；
    const [oMonsterCards, oRoundInstructions, oPlayerCards] = Array.from(oMahjongTable.children);
    const Cards = ["真", "真", "真", "假", "假"];
    for(var i=0; i<5; i++){
      const oPCard = document.createElement('div');
      oPCard.innerText = Cards[i];
      oPCard.className = "手牌";
      oPlayerCards.appendChild(oPCard);

      const oMCard = document.createElement('div');
      oMCard.className = "手牌";
      oMonsterCards.appendChild(oMCard); // 对手的手牌不需要显示文字；
    }
    // 回合指示结合回合流程进行；回合指示区生成指示文字，玩家操作，机器操作，回合结算
    // 规则展示区展示战斗规则和流程
    //await loadCombatRules();
}

async function loadCombatRules(){
  const sceneInfo = sceneIndex["战斗规则"]
  const filePath = sceneIndex.base_path + sceneInfo.file
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
    const combat_rules_text = mytext["战斗规则"];

    var oRuleDisplay = document.createElement("div");
    if(combat_rules_text){
      for(var i=0; i < combat_rules_text.length ; i++){
        var oRules = document.createElement("p");
        oRules.innerHTML = combat_rules_text[i];
        oRules.className = "战斗规则";
        oRuleDisplay.appendChild(oRules);
      }
    }
    console.log("数据加载成功", combat_rules_text);
  }catch(error){
    console.log("出现错误：", error);
    alert('加载文内容失败，请检查控制台。');
  }
}
