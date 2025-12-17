// 战斗场景：剪刀石头布和3句真话2句假话
// 先声明出什么，再选择真假话；3真2假
// a：本次我出“布”；b：本次我出“剪刀”；
// 战斗结束前禁用回退（  ）；结束战斗回合时需要去掉主文本内容区的”战斗场景“class
let isPlayerLeading = null; // 玩家先手吗
let isPlayerRoundWined = null; // 玩家本回合赢了吗

async function bigWorldInteraction(event){
  const target = event.target;

  if(target.tagName != "SPAN" || isBFDisabled == true){return;}
  if(target.classList.contains("魔物")){
    // 异步加载战斗场景
    await loadScene("战斗", "combat", target.outerHTML);// target_value, buttonActive, combat_target;
    // 禁用回退和跳转单元格
    isBFDisabled = true;
    isBtnDisabled = true;
    disabledLiHover();
    console.log("触发了战斗：", target.innerText);

    // 战斗预备，双方信息收集
    const parameters = await createArea(target);
    // 进行战斗回合
    const rounds = 5;
    for(let round=1; round<rounds+1; round++){
      await combatRound(round, parameters);
      let monsterScore = oMonster.getAttribute("score");
      let playerScore = oPlayer.getAttribute("score");
      if(parseInt(monsterScore) >= 3){
        console.log("魔物获胜");
        break;
      }else if(parseInt(playerScore) >= 3){
        console.log("玩家获胜");
        break;
      }else{
        console.log("继续下一回合");
      }
    }
  }else if(target.classList.contains("花卉")){
    active = "采摘";
    console.log("采摘了",target.innerText);
  }
}

async function combatRound(round, parameters){
  const [oMonster, oPlayer, oTextJump, oMonsterArea, oMahjongTable, oPlayerArea, oMonsterCards, oRoundInstructions, oPlayerCards] = parameters;
  // 开始战斗回合
  const roundTip = new RoundTip(oRoundInstructions);
  // 回合一 ;回合指示结合回合流程进行；回合指示区生成指示文字，玩家操作，机器操作，回合结算
  loadSubText("frameRoundStart", "", `================ 回合 ${round} 开始 `);
  await roundTip.threeSecondsShow(`第 ${round} 回合 开始！`); // 回合指示淡入淡出后销毁

  const oRuleDisplay = document.getElementById("副文本规则区");
  const [oRuleHead, oRuleOne, oRuleTwo, oRuleThree, oRuleFour, oRuleFive] = Array.from(oRuleDisplay.children);

  if(round == 1){
    var leadingPlayer = "随机先手为：" + await stepsTwo(oRuleTwo);
  }else{
    var leadingPlayer = "败者先手";
  }
  await roundTip.threeSecondsShow(leadingPlayer);
  const [pHandShapeOne, mHandShapeOne] = await stepsThree(roundTip, oRuleThree, oTextJump, oMonster);
  // console.log("随机先行牌手为：", oLeadingPlayer.innerText);
  const [pHeartCard, mHeartCard] = await stepsFour(roundTip, oRuleFour, oMonsterCards, oPlayerCards, oMonster);
  const [pHandShapeTwo, mHandShapeTwo] = await stepsFive(oMonster, roundTip, oRuleFive, oTextJump, pHandShapeOne, pHeartCard, mHandShapeOne, mHeartCard);
  await roundSettlement(round, roundTip, pHandShapeTwo, mHandShapeTwo, oMonster, oPlayer);
}

async function createArea(target){
  const oContent = document.getElementById("主文本内容区");
  const oJump = document.getElementById("主文本跳转区");
  const [oMonsterArea, oMahjongTable, oPlayerArea] = Array.from(oContent.children);
  const oTextJump = oJump.children[0];
  oContent.classList.add("战斗场景");
  oTextJump.classList.add("战斗选择", "高亮缓动");
  // 战斗双方入场
  oMonsterArea.innerHTML = target.outerHTML; // 有隐患，注意安全问题，以及逐渐寻找更好的方案
  oMonster = oMonsterArea.children[0];
  oMonster.setAttribute("score", 0);
  oPlayerArea.innerHTML = "<span id='玩家'>代号：玩家的名字<span>";
  oPlayer = oPlayerArea.children[0];
  oPlayer.setAttribute("score", 0);
  // 创建牌桌
  const [oMonsterCards, oRoundInstructions, oPlayerCards] = Array.from(oMahjongTable.children);
  await createMahjongTable(oMonsterCards, oPlayerCards);
  return [oMonster, oPlayer, oTextJump, oMonsterArea, oMahjongTable, oPlayerArea, oMonsterCards, oRoundInstructions, oPlayerCards];
}

// 创建牌桌和手牌
async function createMahjongTable(oMonsterCards, oPlayerCards){
  // 牌桌上有双方各有5张牌；
  const Cards = ["真", "真", "真", "假", "假"];
  const boolCards = [true, true, true, false, false];
  for(var i=0; i<5; i++){
    const oPCard = document.createElement('div');
    oPCard.innerText = Cards[i];
    oPCard.className = "心牌 高亮缓动";

    oPCard.setAttribute("value", Cards[i]);
    oPCard.setAttribute("bool", boolCards[i]);
    oPlayerCards.appendChild(oPCard);

    const oMCard = document.createElement('div');
    oMCard.className = "心牌";
    oMCard.setAttribute("value", Cards[i]);
    oMCard.setAttribute("bool", boolCards[i]);
    oMonsterCards.appendChild(oMCard); // 对手的手牌不需要显示文字；
  }
  // 规则展示区展示战斗规则和流程
  await loadSubText("rule", null);
}

//回合指示区显示”回合开始“->回合开始消失->规则2高亮，随机函数选择战斗一方->规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
//->规则4高亮，先行一方选择心牌，回合指示区展示“我方选择心牌”或“对方选择心牌”，心牌区高亮->规则5高亮，锁定手型灰色显示，回合指示区展示“我方出手”或“对方出手"
//回合结算，按照三局两胜的规则重新开局

async function stepsTwo(oRuleTwo){
  // 规则2高亮，随机函数选择战斗一方
  oRuleTwo.classList.add("高亮显示");
  isPlayerLeading = true;//await randomChooseOne([true, false]); // 选择完成后再去高亮

  setTimeout(()=>{
    oRuleTwo.classList.remove("高亮显示");
  }, 3000);
  if(isPlayerLeading){
    return "我方";
  }else{
    return "对方";
  }
}

async function stepsThree(roundTip, oRuleThree, oTextJump, oMonster){
  // 规则3高亮，先行一方选择手型，回合指示区展示“我方选择手型”或“对方选择手型”，手型区高亮
  oRuleThree.classList.add("高亮显示");
  console.log("isPlayerLeading:", isPlayerLeading);

  const [pHandShapeOne, mHandShapeOne] = await Promise.all([
    stepPlayer(stepThreePlayer, [roundTip, oTextJump]),
    stepMonster(stepThreeMonster, [oMonster, roundTip, oTextJump])
  ]);
  console.log("pHandShapeOne", pHandShapeOne);
  console.log("mHandShapeOne", mHandShapeOne);

  oRuleThree.classList.remove("高亮显示");
  console.log("提示已完全消失");

  return [pHandShapeOne, mHandShapeOne];
  async function stepThreePlayer(parameters){
    // 我方操作：手型区高亮，手型区绑定解锁，选择手型，副文本区报手型
    const [roundTip, oTextJump] = parameters;
    const controller = await roundTip.controllerShow("我方选择手型");
    oTextJump.classList.add("高亮显示");
    enableLiHover(); // 启用按钮，但是全局监听
    // 人类的操作空间
    const playerShape = await waitForPlayerClick(["handShape", "可选按钮"]);
    // 收尾
    await controller.finish();
    oTextJump.classList.remove("高亮显示");
    disabledLiHover(); // 禁用按钮
    return playerShape.getAttribute("value");
  }
  async function stepThreeMonster(parameters){
    // 对方操作：手型区锁定，随机选择手型，副文本区报手型
    const [oMonster, roundTip, oTextJump] = parameters;
    const controller = await roundTip.controllerShow("对方选择手型");
    // 等待
    await sleep(1000);
    const monsterShape = randomChooseOne(["剪刀", "石头", "布"]);
    // 收尾
    await controller.finish();
    loadSubText('handShape', monsterShape, oMonster.outerHTML);
    return monsterShape;
  }
}

async function stepPlayer(specific, parameters){
  await waitForCondition(() => isPlayerLeading);
  console.log("我方开始操作");
  // 我方具体操作
  const result = await specific(parameters);
  // 善后
  isPlayerLeading = false;
  console.log("我方结束操作");
  return result;
}
async function stepMonster(specific, parameters){
  await waitForCondition(() => !isPlayerLeading);
  console.log("对方开始操作");
  // 对方具体操作
  const result = await specific(parameters);
  isPlayerLeading = true;
  console.log("对方结束操作");
  return result;
}

async function waitForCondition(condition){
  while(!condition()){
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
async function waitForPlayerClick(parameters){
  const [mode, findClass] = parameters
  return new Promise((resolve) => {
    document.addEventListener("click", function onClickHandler(event){
      const target = event.target;
      if (target.classList.contains(findClass)){
        document.removeEventListener('click', onClickHandler);
        loadSubText(mode, target.getAttribute("value")); // 副文本区的内容加载应该不用异步吧；
        resolve(target);
      }
    });
  });
}

async function stepsFour(roundTip, oRuleFour, oMonsterCards, oPlayerCards, oMonster){
  // 规则4高亮，先行一方选择心牌，回合指示区展示“我方选择心牌”或“对方选择心牌”，心牌区高亮
  oRuleFour.classList.add("高亮显示");

  const [pHeartCard, mHeartCard] = await Promise.all([
    stepPlayer(stepFourPlayer, [roundTip, oPlayerCards]),
    stepMonster(stepFourMonster, [oMonster, roundTip, oMonsterCards])
  ]);
  console.log("pHeartCard", pHeartCard);
  console.log("mHeartCard", mHeartCard);

  oRuleFour.classList.remove("高亮显示");
  console.log("提示已完全消失");
  return [pHeartCard, mHeartCard];
  async function stepFourPlayer(parameters){
    //我方操作：牌区高亮，牌可点击，有hover效果，点击完成去掉hover效果；
    const [roundTip, oPlayerCards] = parameters;
    const controller = await roundTip.controllerShow("我方选择心牌");
    oPlayerCards.classList.add("高亮显示");
    const oCards = oPlayerCards.children;
    for(var i=0; i<oCards.length; i++){
      oCards[i].classList.add("可选心牌");
    }
    // 人类操作
    const playerCard = await waitForPlayerClick(["heartCard","可选心牌"]);
    // 收尾
    playerCard.style.visibility = "hidden"; // hidden 还是 remove ,it's a problem;
    await controller.finish();
    for(var i=0; i<oCards.length; i++){
      oCards[i].classList.remove("可选心牌");
    }
    oPlayerCards.classList.remove("高亮显示");
    return playerCard.getAttribute("bool") === "true";
  }
  async function stepFourMonster(parameters){
    //对方操作：牌区高亮，等待2s，选牌，副文本区公示
    const [oMonster, roundTip, oMonsterCards] = parameters;
    const controller = await roundTip.controllerShow("对方选择心牌");
    // 等待
    await sleep(1000);
    const oCards = oMonsterCards.children;
    const monsterCard = randomChooseOne(oCards);
    // 收尾
    monsterCard.remove();
    await controller.finish();
    loadSubText("heartCard", "暂时保密", oMonster.outerHTML);// 双方心牌保密
    return monsterCard.getAttribute("bool") === "true";
  }
}
async function stepsFive(oMonster, roundTip, oRuleFive, oTextJump, pHandShapeOne, pHeartCard, mHandShapeOne, mHeartCard){
  //规则5高亮，锁定手型灰色显示，回合指示区展示“我方出手”或“对方出手"
  oRuleFive.classList.add("高亮显示");

  const [pHandShapeTwo, mHandShapeTwo] = await Promise.all([
    stepPlayer(stepFivePlayer, [roundTip, oTextJump, pHandShapeOne, pHeartCard]),
    stepMonster(stepFiveMonster, [oMonster, roundTip, mHandShapeOne, mHeartCard])
  ]);
  console.log("pHandShapeTwo", pHandShapeTwo);
  console.log("mHandShapeTwo", mHandShapeTwo);

  oRuleFive.classList.remove("高亮显示");
  return [pHandShapeTwo, mHandShapeTwo];
  async function stepFivePlayer(parameters){
    const [roundTip, oTextJump, pHandShapeOne, pHeartCard] = parameters;
    // 我方操作：手型区高亮，跳转hover解锁，根据上两步的结果锁定跳转，点击手型
    const controller = await roundTip.controllerShow("我方打出手型");
    oTextJump.classList.add("高亮显示");
    enableLiHover(getHandShapeObject(pHandShapeOne, pHeartCard));
    // 人类操作：
    const playerShape = await waitForPlayerClick(["handShape", "可选按钮"]);
    // 收尾
    await controller.finish();
    oTextJump.classList.remove("高亮显示");
    disabledLiHover();
    return playerShape.getAttribute("value");
  }
  async function stepFiveMonster(parameters){
    const [oMonster, roundTip, mHandShapeOne, mHeartCard] = parameters;
    // 对方操作：展示“对方打出手型”，sleep(2000)，选择手型，副文本区公示
    const controller = await roundTip.controllerShow("对方打出手型");
    // 等待
    await sleep(1000);
    const handShapeObject = getHandShapeObject(mHandShapeOne, mHeartCard);
    const handShapeArray = Object.keys(handShapeObject).filter(key => handShapeObject[key]);
    const monsterShape = randomChooseOne(handShapeArray);
    // 收尾
    await controller.finish();
    loadSubText("handShape", "暂时保密", oMonster.outerHTML);
    return monsterShape;
  }
}

async function roundSettlement(round, roundTip, pHandShapeTwo, mHandShapeTwo, oMonster, oPlayer){
  loadSubText("compare", oMonster.outerHTML+"出了 "+mHandShapeTwo, "你出了 "+pHandShapeTwo);
  const isPlayerRoundWined = getIsPlayerWined(pHandShapeTwo, mHandShapeTwo);
  var roundText;
  if(isPlayerRoundWined === true){
    roundText = "我方胜出";
    oPlayer.setAttribute("score", parseInt(oPlayer.getAttribute("score"), 10) + 1);
    isPlayerLeading = false;
  }else if(isPlayerRoundWined === null){
    roundText = "平局";
  }else{
    roundText = "对方胜出";
    oMonster.setAttribute("score", parseInt(oMonster.getAttribute("score"), 10) + 1);
    isPlayerLeading = true;
  }
  loadSubText("frameRoundEnd", "", `================ 回合 ${round} 结束 `);
  loadSubText("showScore", oPlayer.getAttribute("score"), oPlayer.outerHTML);
  loadSubText("showScore", oMonster.getAttribute("score"), oMonster.outerHTML);
  await roundTip.threeSecondsShow(roundText);
  roundTip.destroy();
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
    this.tip.remove();
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
function enableLiHover(handShapeObject = {"剪刀": true, "石头": true, "布": true}){
  const allLis = document.querySelectorAll(".跳转单元格");
  allLis.forEach(li => {
    if(handShapeObject[li.getAttribute("value")]){
      li.classList.add("可选按钮");
    }
  })
}
function getHandShapeObject(handShape, shapeBool){
  const handShapeObject = {
    "剪刀": !shapeBool,
    "石头": !shapeBool,
    "布": !shapeBool
  };
  handShapeObject[handShape] = shapeBool;
  return handShapeObject;
}
function getIsPlayerWined(handShapeOne, handShapeTwo){
  const RPS = {
    "剪刀": 0,
    "石头": 1,
    "布": 2
  }
  const diff = (RPS[handShapeOne] - RPS[handShapeTwo] + 3) % 3;
  return diff === 0 ? null : diff === 1 ? true : false;
}
