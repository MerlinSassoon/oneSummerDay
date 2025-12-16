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
    // 禁用回退
    isBFDisabled = true;
    active = "combat";
    // 进行战斗回合
    combatRound(target);
    console.log("触发了战斗：", target.innerText);
  }else if(target.classList.contains("花卉")){
    active = "采摘";
    console.log("采摘了",target.innerText);
  }
}

async function combatRound(target){
  const oContent = document.getElementById("主文本内容区");
  const oJump = document.getElementById("主文本跳转区");
  const [oMonsterArea, oMahjongTable, oPlayerArea] = Array.from(oContent.children);
  const [oTextJump] = Array.from(oJump.children);
  // 战斗双方入场
  oMonsterArea.innerHTML = target.outerHTML; // 有隐患，注意安全问题，以及逐渐寻找更好的方案
  oMonster = oMonsterArea.children[0];
  oPlayerArea.innerHTML = "<span id='玩家'>代号：玩家的名字<span>";
  oPlayer = oPlayerArea.children[0];
  // 创建牌桌
  const [oMonsterCards, oRoundInstructions, oPlayerCards] = Array.from(oMahjongTable.children);
  await createMahjongTable(oMonsterCards, oPlayerCards);
  // 开始战斗回合
  const roundTip = new RoundTip(oRoundInstructions);
  // 回合一 ;回合指示结合回合流程进行；回合指示区生成指示文字，玩家操作，机器操作，回合结算
  await roundTip.threeSecondsShow("第一回合 开始！"); // 回合指示淡入淡出后销毁

  const oRuleDisplay = document.getElementById("副文本规则区");
  const [oRuleHead, oRuleOne, oRuleTwo, oRuleThree, oRuleFour, oRuleFive] = Array.from(oRuleDisplay.children);

  const oLeadingPlayer = await stepsTwo(oMonster, oPlayer, oRuleTwo);
  await roundTip.threeSecondsShow("随机先行牌手为："+oLeadingPlayer.innerText);

  await stepsThree(oLeadingPlayer, roundTip, oRuleThree, oTextJump);

  // console.log("随机先行牌手为：", oLeadingPlayer.innerText);
}

// 创建牌桌和手牌
async function createMahjongTable(oMonsterCards, oPlayerCards){
  // 牌桌上有双方各有5张牌；
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
  // 规则展示区展示战斗规则和流程
  await loadSubText(["rule_mode", null]);
}

async function roundTips(roundTip, round){
  //回合指示区显示”回合开始“->回合开始消失->规则2高亮，随机函数选择战斗一方->规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
  //->规则4高亮，先行一方选择心牌，回合指示区展示“我方选择心牌”或“对方选择心牌”，心牌区高亮->规则5高亮，锁定手型灰色显示，回合指示区展示“我方出手”或“对方出手"
  //回合结算，按照三局两胜的规则重新开局

}

async function stepsTwo(oMonster, oPlayer, oRuleTwo){
  // 规则2高亮，随机函数选择战斗一方
  oRuleTwo.classList.add("高亮显示");
  oLeadingPlayer = await randomChooseOne(oMonster, oPlayer); // 选择完成后再去高亮
  setTimeout(()=>{
    oRuleTwo.classList.remove("高亮显示");
  }, 3000);
  return oLeadingPlayer;
}

async function stepsThree(oLeadingPlayer, roundTip, oRuleThree, oTextJump){
  // 规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
  oRuleThree.classList.add("高亮显示");
  oTextJump.classList.add("高亮显示");
  const controller = await roundTip.controllerShow(oLeadingPlayer.innerText+"选择手型");
  /*setTimeout(async ()=>{
    console.log("3s过去了", controller);
    await controller.finish();
    console.log("提示已完全消失");
  }, 3000);*/
}

// 回合指示器类
class RoundTip{
  constructor(oFather){
    this.tip = null;
    this.parent = oFather;
    this.init();
  }

  init(){
    this.tip = document.createElement("span");
    this.tip.className = "round-tip";
    this.parent.appendChild(this.tip);
  }

  destroy(){
    this.tip.innerText = "";
  }

  async threeSecondsShow(roundText){
    return new Promise((resolve) => {
      this.tip.innerText = roundText;

      this.tip.classList.remove('show');
      requestAnimationFrame(() => {
          this.tip.classList.add('show');
      });

      setTimeout(()=>{
        this.tip.classList.remove("show");
        setTimeout(()=>{
          resolve();
        }, 1000);
      }, 3000);
    });
  }

  async controllerShow(roundText){
    return new Promise((resolve) => {
      this.tip.innerText = roundText;

      this.tip.classList.remove('show');
      requestAnimationFrame(() => {
          this.tip.classList.add('show');
      });

      const controller = {
        finish: () => {
          return new Promise((finishResolve) => {
            this.tip.classList.remove("show");
            setTimeout(()=>{
              resolve();
              finishResolve();
            }, 1000);
          });
        },
        cancel: () => {
          this.tip.classList.remove("show");
          setTimeout(()=>{
            resolve();
          }, 1000);
        },
        updateText: () => {
          this.tip.innerText = newText;
        }
      };

      resolve(controller);
    });
  }
}

function randomChooseOne(element_one, element_two){
  return Math.random() < 0.5 ? element_one : element_two;
}
