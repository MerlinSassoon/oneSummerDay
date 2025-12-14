// 战斗场景：剪刀石头布和3句真话2句假话
// 先声明出什么，再选择真假话；3真2假
// a：本次我出“布”；b：本次我出“剪刀”；
// 战斗结束前禁用回退（  ）；结束战斗回合时需要去掉主文本内容区的”战斗场景“class

async function bigWorldInteraction(event){
  const target = event.target;

  if(target.tagName != "SPAN"){return;}
  if(target.classList.contains("魔物")){
    // 异步加载战斗场景
    await loadScene("战斗");
    // 创建牌桌
    createMahjongTable(target);

    console.log("触发了战斗：", target.innerText);
    //combat_monster(target);
  }else if(target.classList.contains("花卉")){
    console.log("采摘了",target.innerText);
  }
}

function createMahjongTable(target){
    const oCombatScene = document.getElementById("主文本内容区");
    oCombatScene.className = "战斗场景"
    const oCombatChoose = document.getElementById("主文本跳转区");
    oCombatChoose.className = "战斗选择"

    const oMonster = document.getElementById("对手");
    oMonster.innerHTML = target.outerHTML; // 有隐患，注意安全问题，以及逐渐寻找更好的方案
    const oMonsterArea = oMonster.parentNode;
    oMonsterArea.className = "对手场地";

    const oMahjongTable = document.getElementById("牌桌");
    const oMahjongTableArea = oMahjongTable.parentNode;
    oMahjongTableArea.className = "牌桌场地";

    const oPlayer = document.getElementById("玩家");
    oPlayer.innerText = "代号：玩家的名字";
    const oPlayerArea = oPlayer.parentNode;
    oPlayerArea.className = "玩家场地";
}
