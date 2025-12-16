// 战斗场景：剪刀石头布和3句真话2句假话
// 先声明出什么，再选择真假话；3真2假
// a：本次我出“布”；b：本次我出“剪刀”；
// 战斗结束前禁用回退（  ）；结束战斗回合时需要去掉主文本内容区的”战斗场景“class
let isPlayerLeading = null; // 玩家先手吗

async function bigWorldInteraction(event){
  const target = event.target;

  if(target.tagName != "SPAN"){return;}
  if(target.classList.contains("魔物")){
    // 异步加载战斗场景
    await loadScene("战斗", "combat", target.innerText);
    // 禁用回退和跳转单元格
    isBFDisabled = true;
    isBtnDisabled = true;
    disabledLiHover();
    // 进行战斗回合
    combatRound(target);
    console.log("触发了战斗：", target.innerText);
  }else if(target.classList.contains("花卉")){
    active = "采摘";
    console.log("采摘了",target.innerText);
  }
}

async function combatRound(target){
  const oTextContent = document.getElementById("主文本内容区");
  const oTextJump = document.getElementById("主文本跳转区");
  const [oMonsterArea, oMahjongTable, oPlayerArea] = Array.from(oTextContent.children);
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

  const leadingPlayer = await stepsTwo(oRuleTwo);
  await roundTip.threeSecondsShow("随机先手为：" + leadingPlayer);

  await stepsThree(leadingPlayer, roundTip, oRuleThree, oTextJump);
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
  await loadSubText(["rule", null]);
}

async function roundTips(roundTip, round){
  //回合指示区显示”回合开始“->回合开始消失->规则2高亮，随机函数选择战斗一方->规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
  //->规则4高亮，先行一方选择心牌，回合指示区展示“我方选择心牌”或“对方选择心牌”，心牌区高亮->规则5高亮，锁定手型灰色显示，回合指示区展示“我方出手”或“对方出手"
  //回合结算，按照三局两胜的规则重新开局

}

async function stepsTwo(oRuleTwo){
  // 规则2高亮，随机函数选择战斗一方
  oRuleTwo.classList.add("高亮显示");
  isPlayerLeading = await randomChooseOne([true, false]); // 选择完成后再去高亮

  setTimeout(()=>{
    oRuleTwo.classList.remove("高亮显示");
  }, 3000);
  if(isPlayerLeading){
    return "我方";
  }else{
    return "对方";
  }
}

async function stepsThree(leadingPlayer, roundTip, oRuleThree, oTextJump){
  // 规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
  oRuleThree.classList.add("高亮显示");
  console.log("isPlayerLeading:", isPlayerLeading);

  const pHandShapeOne = stepPlayer(stepThreePlayer, oTextJump);
  const mHandShapeOne = stepMonster(stepThreeMonster, oTextJump);

  await Promise.all([pHandShapeOne, mHandShapeOne]);

  oRuleThree.classList.remove("高亮显示");
  console.log("提示已完全消失");

  async function stepThreePlayer(oTextJump){
    // 我方操作：手型区高亮，手型区绑定解锁，选择手型，副文本区报手型
    const controller = await roundTip.controllerShow("我方选择手型");
    oTextJump.classList.add("高亮显示");
    enableLiHover();
    isBtnDisabled = false;
    // 人类的操作空间
    const clickedElement = await waitForPlayerClick("跳转单元格");
    controller.finish();
    return clickedElement.value;
  }
  async function stepThreeMonster(oTextJump){
    // 对方操作：手型区锁定，随机选择手型，副文本区报手型
    isBtnDisabled = true;
    const controller = await roundTip.controllerShow("对方选择手型");
    oTextJump.classList.remove("高亮显示");
    await sleep(3000);

    const monsterShape = randomChooseOne(["剪刀", "石头", "布"]);
    await loadSubText(['handShape', monsterShape]);
    await controller.finish();
    return monsterShape;
  }
  /*setTimeout(async ()=>{
    console.log("3s过去了", controller);
    await controller.finish();
    console.log("提示已完全消失");
  }, 3000);*/
}

async function stepPlayer(specific, oTextJump){
  await waitForCondition(() => isPlayerLeading);
  console.log("我方开始操作");
  // 我方具体操作
  const result = await specific(oTextJump);
  // 善后
  isBtnDisabled = true;
  oTextJump.classList.remove("高亮显示");
  disabledLiHover();
  isPlayerLeading = false;
  console.log("我方结束操作");
  return result;
}

async function stepMonster(specific, oTextJump){
  await waitForCondition(() => !isPlayerLeading);
  console.log("对方开始操作");
  // 对方具体操作
  const result = await specific(oTextJump);
  isPlayerLeading = true;
  console.log("对方结束操作");
  return result;
}

async function waitForCondition(condition){
  while(!condition()){
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function waitForPlayerClick(findClass){
  return new Promise((resolve) => {
    document.addEventListener("click", function onClickHandler(event){
      const target = event.target;
      if (target.classList.contains(findClass)){
        document.removeEventListener('click', onClickHandler);
        resolve(target);
      }
    });
  });
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
          console.log("🟢 controller.finish() 被调用");
          return new Promise((finishResolve) => {
            console.log("⏳ 开始执行清理动画...");
            this.tip.classList.remove("show");
            setTimeout(()=>{
              console.log("✅ 清理完成", this.tip.outerHTML);
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
        updateText: (newText) => {
          this.tip.innerText = newText;
        }
      };

      resolve(controller);
    });
  }
}

function randomChooseOne(element_array){
  const randomIndex = Math.floor(Math.random() * element_array.length);
  return element_array[randomIndex];
}

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, 3000));
}

function disabledLiHover(){
  const allLis = document.querySelectorAll(".跳转单元格");
  allLis.forEach(li => {
    li.classList.remove("可选按钮");
  })
}
function enableLiHover(){
  const allLis = document.querySelectorAll(".跳转单元格");
  allLis.forEach(li => {
    li.classList.add("可选按钮");
  })
}